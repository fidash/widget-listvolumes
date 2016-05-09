#List Volumes Widget

[![GitHub license](https://img.shields.io/badge/license-Apache%202-blue.svg)](https://raw.githubusercontent.com/fidash/widget-listvolumes/master/LICENSE)
[![Support badge](https://img.shields.io/badge/support-askbot-yellowgreen.svg)](http://ask.fiware.org)
[![Build Status](https://build.conwet.fi.upm.es/jenkins/view/FI-Dash/job/Widget%20ListVolumes/badge/icon)](https://build.conwet.fi.upm.es/jenkins/view/FI-Dash/job/Widget%20ListVolumes/)

This project is part of [FIWARE](https://www.fiware.org/). This widget is part of FI-Dash component included in FIWARE.

The widget displays a list of volumes available to the user in FIWARE's Cloud. The widget also has multi-region support and allows the creation of new volumes.


## Wiring endpoints

The List Volume widget has the following wiring endpoints:

|Label|Name|Friendcode|Type|Description|
|:--:|:--:|:--:|:--:|:--|
|Authentication|authentication|openstack-auth|text|Receive the authentication data via wiring.|
|Volume ID|volume_id|volume_id|text|Sends volume ID and OpenStack access.|


## User preferences

List Volume has the following preferences:

|Label|Name|Type|Default|Description|
|:--:|:--:|:--:|:--:|:--|
|Size|size|boolean|true|Activate to display the size column|
|Snapshot|snapshot_id|boolean|false|Activate to display the snapshot column|
|Volume Type|volume_type|boolean|false|Activate to display the volume type column|
|Created|created_at|boolean|false|Activate to display the created column|
|Availability Zone|availability_zone|boolean|true|Activate to display the availability zone column|
|Status|status|boolean|true|Activate to display the status column|
|Name|name|boolean|true|Activate to display the name column|
|ID|id|boolean|false|Activate to display the id column|
