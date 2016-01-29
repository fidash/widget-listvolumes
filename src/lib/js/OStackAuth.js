// import "babel-polyfill"; // Include in browser BEFORE
var OStackAuth = (function () {
    "use strict";
    const CLOUD_URL = "https://cloud.lab.fiware.org";
    const IDM_URL = "https://account.lab.fiware.org";
    const SYNC_URL = "http://private-anon-7cf62f491-glancesync.apiary-mock.com";


    // buildOps("POST", {token: "token"})
    const buildOps = function buildOps(method, reqops) {
        "use strict";
        const ops = {
            method: method
        };

        if (reqops.token) {
            ops.requestHeaders = {
                "X-Auth-Token": reqops.token,
                "Accept": "application/json"
            };
        }

        if (reqops.fiware) {
            ops.requestHeaders = {
                "X-FI-WARE-OAuth-Token": "true",
                "X-FI-WARE-OAuth-Token-Body-Pattern": reqops.fiware,
                "Accept": "application/json"
            };
        }

        if (reqops.body) {
            ops.contentType = "application/json";
            ops.postBody = JSON.stringify(reqops.body);
        }

        return ops;
    };


    // Need Promise
    const requestPromise = function requestPromise(url, options) {
        options = options || {};
        return new Promise(function (resolve, reject) {
            options.onSuccess = resolve;
            options.onFailure = reject;
            MashupPlatform.http.makeRequest(url, options);
        });
    };

    // Cloud URL
    const getOpenStackToken = function getOpenStackToken(url) {
        "use strict";
        const postBody = {
            auth: {
                identity: {
                    methods: [
                        "oauth2"
                    ],
                    oauth2: {
                        "access_token_id": "%fiware_token%"
                    }
                }
            }
        };

        const options = buildOps("POST", {fiware: "%fiware_token%", body: postBody});

        return requestPromise(url + "/keystone/v3/auth/tokens", options);
    };

    const getOpenStackProjectToken = function getOpenStackProjectToken(url, projectId) {
        "use strict";
        const postBody = {
            auth: {
                identity: {
                    methods: [
                        "oauth2"
                    ],
                    oauth2: {
                        "access_token_id": "%fiware_token%"
                    }
                },
                scope: {
                    project:{
                        id: projectId
                    }
                }
            }
        };

        const options = buildOps("POST", {fiware: "%fiware_token%", body: postBody});

        return requestPromise(url + "/keystone/v3/auth/tokens", options);
    };


    const isAdmin = function isAdmin(roles) {
        return roles
            .filter(x => x.name === "InfrastructureOwner").length > 0;
    };

    // IDM URL
    const getAdminRegions = function getAdminRegions(url) {
        "use strict";
        const options = buildOps("GET", {fiware: "access_token"});

        return requestPromise(url + "/user", options)
            .then(response => JSON.parse(response.responseText).organizations.filter(x => isAdmin(x.roles)).map(x => x.replace("FIDASH", "").trim()));
    };

    // Segundo paso de Auth?
    const getProjects = function getProjects(url, response) {
        "use strict";
        const generalToken = response.getHeader('x-subject-token');
        const username = MashupPlatform.context.get('username');
        const options = buildOps("GET", {token: generalToken});

        return requestPromise(url + "/keystone/v3/role_assignments?user.id=" + username, options)
            .then(resp => {
                const responseBody = JSON.parse(resp.responseText);
                return Promise.all(
                    responseBody.role_assignments
                        .map(role => {
                            if (role.scope.project) {
                                return getProjectPermissions(url, role.scope.project.id, generalToken).then(p => ({ok: true, data: p}));
                            }
                            return Promise.resolve({ok: false});
                        }))
                    .then(l => {
                        return l.filter(x => x.ok && x.data !== "").map(x => x.data);
                    });

            });
    };

    // Cloud URL
    const getProjectPermissions = function getProjectPermissions(url, project, token) {
        "use strict";
        const options = buildOps("GET", {token: token});

        return requestPromise(url + "/keystone/v3/projects/" + project, options)
            .then(resp => {
                const responseBody = JSON.parse(resp.responseText);
                if (responseBody.project.is_cloud_project) {
                    return getOpenStackProjectToken(url, project)
                        .then(token => ({token: token.getHeader('x-subject-token'), response: token}));
                } else {
                    return Promise.resolve("");
                }
            });
    };


    // Cloud URL
    const getImagesRegion = function getImagesRegion(url, region, token) {
        "use strict";
        return $.ajax({
            url: `${url}/${region}/image/v1/images/detail`,
            headers: {
                "X-Auth-Token": token,
                "Accept": "application/json"
            }
        }).promise();

        // const options = buildOps("GET", {token: token});

        // return requestPromise(`${url}/${region}/image/v1/images/detail`, options);
    };


    // Sync URL
    const sync = function sync(url, region, token) {
        "use strict";
        const options = buildOps("POST", {token: token});

        return requestPromise(`${url}/regions/${region}`, options);
    };

    // Nova
    // CLOUD URL

    const getProject = function getProject(url) {
        return getOpenStackToken(url).then(asJSON).then(jreq => {
            return jreq.token.project;
        });
    };

    const getFlavorList = function getFlavorList(url, region, projectid, token, detailed) {
        const detailS = (detailed) ? "/detail" : "";
        const options = buildOps("GET", {token: token});

        return requestPromise(`${url}/${region}/compute/v2/${projectid}/flavors${detailS}`, options);
    };


    // Neutron

    const getNetworksList = function getNetworksList(url, region, token) {
        const options = buildOps("GET", {token: token});

        return requestPromise(`${url}/${region}/network/v2.0/networks`, options);
    };

    const createServer = function createServer(url, region, projectid, token, ops) {
        var data = {
            "server" : {
                "name" : ops.name,
                "imageRef" : ops.imageRef,
                "flavorRef" : ops.flavorRef
                //"nics": nics
            }
        };

        if (ops.metadata) {
            data.server.metadata = ops.metadata;
        }

        var urlPost = (ops.block_device_mapping !== undefined) ? "/os-volumes_boot" : "/servers";

        if (ops.key_name !== undefined) {
            data.server.key_name = ops.key_name;
        }

        if (ops.user_data !== undefined) {
            data.server.user_data = btoa(ops.user_data);
        }

        if (ops.block_device_mapping !== undefined) {
            data.server.block_device_mapping = ops.block_device_mapping;
        }

        if (ops.security_groups !== undefined) {
            var i, groups;
            for (i in ops.security_groups) {
                if (ops.security_groups[i] !== undefined) {
                    var group = {
                        "name" : ops.security_groups[i]
                    };
                    groups.push(group);
                }
            }

            data.server.security_groups = groups;
        }

        if (ops.min_count === undefined) {
            ops.min_count = 1;
        }

        data.server.min_count = ops.min_count;

        if (ops.max_count === undefined) {
            ops.max_count = 1;
        }

        data.server.max_count = ops.max_count;

        if (ops.availability_zone !== undefined) {
            data.server.availability_zone = btoa(ops.availability_zone);
        }

        if (ops.networks !== undefined) {
            data.server.networks = ops.networks;
        }

        const options = buildOps("POST", {token: token, body: data});

        return requestPromise(`${url}/${region}/image/v1`, options);
    };

    const asJSON = function asJSON(req) {
        return JSON.parse(req.response);
    };

    const delay = function delay(ms) {
        return new Promise(function (resolve, reject) {
            setTimeout(resolve, ms);
        });
    };

    const getTokenAndParams = function getTokenAndParams(url) {
        return getOpenStackToken(CLOUD_URL) // Get initial token
            .then(responseR => {
                return getProjects(CLOUD_URL, responseR)
                    .then(x => (x.length > 0) ? Promise.resolve(x[0]) : Promise.reject("No token"));
            });
    };



    const getTokenAllSteps = function getTokenAllSteps() {
        return getOpenStackToken(CLOUD_URL) // Get initial token
            .then(getProjects.bind(null, CLOUD_URL)) // Then get projects token
            .then(x => x.filter(y => y !== ""))
            .then(x => (x.length > 0) ? Promise.resolve(x[0]) : Promise.reject("No token"));
    };

    return {
        CLOUD_URL: CLOUD_URL,
        SYNC_URL: SYNC_URL,
        IDM_URL: IDM_URL,
        asJSON: asJSON,
        getOpenStackToken: getOpenStackToken,
        getOpenStackProjectToken: getOpenStackProjectToken,
        getAdminRegions: getAdminRegions,
        getProject: getProject,
        getFlavorList: getFlavorList,
        getProjects: getProjects,
        getProjectPermissions: getProjectPermissions,
        getImagesRegion: getImagesRegion,
        getNetworksList: getNetworksList,
        createServer: createServer,
        sync: sync,
        getTokenAndParams: getTokenAndParams,
        getTokenAllSteps: getTokenAllSteps,
        delay: delay
    };
})();



// // Get token?
// getTokenAllSteps().then(x => console.log(x)) // TOKEN!
//     .catch(e => {
//         console.log("ERROR:", e);
//     });
