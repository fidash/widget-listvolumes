#List Volumes Widget

This project is part of [FIWARE](https://www.fiware.org/). This widget is part of FI-Dash component included in FIWARE.

The widget displays a list of volumes available to the user in FIWARE's Cloud. The widget also has multi-region support and allows the creation of new volumes.


## Wiring endpoints

The List Volume widget has the following wiring endpoints:

|Way|Name|Type|Description|Label|Friendcode|
|:--:|:--:|:--:|:--:|:--:|:--:|
|output|volume_id|text|Sends volume ID and OpenStack access.|Volume ID|volume_id|
|output|image_id|text|Sends the image ID and OpenStack access.|Image ID|image_id|


## User preferences

List Volume has the following preferences:

|Name|Type|Description|Label|Default|
|:--:|:--:|:--:|:--:|:--:|
|size|boolean|Activate to display the size column|Size|true|
|snapshot_id|boolean|Activate to display the snapshot column|Snapshot|false|
|volume_type|boolean|Activate to display the volume type column|Volume Type|false|
|created_at|boolean|Activate to display the created column|Created|false|
|availability_zone|boolean|Activate to display the availability zone column|Availability Zone|true|
|status|boolean|Activate to display the status column|Status|true|
|name|boolean|Activate to display the name column|Name|true|
|id|boolean|Activate to display the id column|ID|false|
