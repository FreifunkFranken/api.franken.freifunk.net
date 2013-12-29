process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var express = require('express');
var moment = require('moment');
var xml2js = require('xml2js');
var rest = require('restler'); //also requires xml2js
var app = express();

/**
 * TODO
 * @param res
 * @param code
 * @param error
 * @param reason
 * @returns error object
 */
function _returnError(res, code, error, reason) {
	var e = {
		error: error,
		reason: reason,
	};
	res.statusCode = code;
	res.send(e);
	return e;
}

/**
 * cleanup of unnecessary arrays:
 * key: [ value ] ==> key: value
 * @param obj
 * @returns clean object
 */
function _cleanObject(obj) {
	var object = {};
	for (var key in obj) {
		var val = obj[key];
		if (val[0].length>0) {
			object[key] = val[0];
		}
	}
	return object;
}

/** **************************************************************************
 * get all nodes
 */
app.get('/nodes', function(req, res) {
	var routerlist = null;
	
	function createResponse(routerlist) {
		if (routerlist === null) {
			return;
		}
		
		var nodes = [];
		routerlist.forEach(function(item) {
			console.log("node " + item.router_id[0] + " (" + item.hostname[0] + ")");
			_cleanObject(item.user[0]);
			
			var node = {
				"api_rev": "1.0",
				"type": "router",
				"hostname": item.hostname[0],
				"ctime" : moment.unix(item.create_date[0]).format(),
				"mtime" : moment().format(),
				"lat": item.latitude[0],
				"lon": item.longitude[0],
				"community": "Freifunk/Franken",
				"attributes": {
					"netmon": {
						"id": item.router_id[0],
						"url": "https://netmon.freifunk-franken.de/router.php?router_id=" + item.router_id[0],
					},
					"user": _cleanObject(item.user[0]),
					"chipset": _cleanObject(item.chipset[0]),
					"statusdata": _cleanObject(item.statusdata[0])
				}
			};
			
			if (item.description[0].length>0) { node.site = item.description[0]; }
			
			nodes.push(node);
		});
		res.json(nodes);
	}
	
	rest.get("https://netmon.freifunk-franken.de/api/rest/routerlist/?status=online&limit=9999").on('success', function(data, response) {
		if (data.netmon_response === undefined) {
			return; //_returnError(res, 404, "not_found", data);
		}
		if (data.netmon_response.routerlist === undefined) {
			return; //_returnError(res, 404, "not_found", data);
		}
		routerlist = data.netmon_response.routerlist[0].router;
		createResponse(routerlist);
	});
});


/** **************************************************************************
 * get node data by (netmon) id
 */
app.get('/node/:id', function(req, res) {
	var router = null;
	var interfaces = null;
	
	function createResponse(router, interfaces) {
		if ((router === null) /*|| (interfaces === null)*/) {
			return;
		}
		
		/*
		var tmpInterfaces = [];
		for (var n=0; n<interfaces.length; n=n+1) {
			var status = interfaces[n].statusdata[0];
			var iface = {};
			
			if (interfaces[n].name[0].length>0) {
				iface.name = interfaces[n].name[0];
			} else {
				continue;
			}
			
			if (iface.name.indexOf('wlan')>=0) {
				iface.physicalType = 'wifi';
				iface.encryption = "none";
				iface.access = "free";
			} else if (iface.name.indexOf('eth')>=0) {
				iface.physicalType = 'ethernet';
			}
			
			if (status.mac_addr[0].length>0) {
				iface.macAddress = status.mac_addr[0];
			}
			tmpInterfaces.push(iface);
		}
		*/
		
		var node = {
			"api_rev": "1.0",
			"type": "router",
			"hostname": router.hostname[0],
			"ctime" : moment.unix(router.create_date[0]).format(),
			"mtime" : moment().format(),
			"lat": router.latitude[0],
			"lon": router.longitude[0],
			"community": "Freifunk/Franken"
//			"attributes": {
//				"firmware": {
//					"name": "meshkit",
//					"rev": "47d69e2001a789a104117af266332c73919b4326",
//					"url": "http://meshkit.freifunk.net/"
//				}
//			}
//			"elev": 50,
//			"aliases": [
//				{
//					"type": "olsr",
//					"alias": "104.201.0.29"
//				},
//				{
//					"type": "olsr",
//					"alias": "awesome-router.olsr"
//				},
//				{
//					"type": "batman-adv",
//					"alias": "21:13:f1:a5:a2:20"
//				}
//			],
//			"links": [
//				{
//					"type": "olsr",
//					"alias_local": "104.201.0.29",
//					"alias_remote": "104.201.0.64",
//					"quality": 0.78,
//					"attributes": {
//						"etx": 2.094,
//						"lq": 0.588,
//						"nlq": 0.812
//					}
//				},
//				{
//					"type": "batman-adv",
//					"alias_local":"21:13:f1:a5:a2:20",
//					"alias_remote": "52:23:61:a7:a1:56",
//					"quality": 0.78
//				}
//			]
		};
		
		/*
		{
			"_id" : "FREIFUNKFRANKEN_NETMON_ID_" + router.router_id[0],
			"type" : "node",
			"hostname" : router.hostname[0],
			"latitude" : router.latitude[0],
			"longitude" : router.longitude[0],
			"updateInterval" : 60,
			"ctime" : moment.unix(router.create_date[0]).format(),
			"mtime" : moment().format(),
			"hardware" : {
				"model" : router.chipset[0].hardware_name[0]
			},
			"community" : {
				"name" : "Freifunk Franken",
				"url" : "http://franken.freifunk.net"
			},
			"interfaces": tmpInterfaces
		};
		*/
		
		if (router.location[0].length>=0) {
			node.site = router.location[0];
		}
		
		res.json(node);
	}
	
	rest.get("https://netmon.freifunk-franken.de/api/rest/router/" + req.params.id).on('success', function(data, response) {
		if (data.netmon_response === undefined) {
			return; //_returnError(res, 404, "not_found", data);
		}
		if (data.netmon_response.router === undefined) {
			return; //_returnError(res, 404, "not_found", data);
		}
		router = data.netmon_response.router[0];
		createResponse(router, interfaces);
	});
	
//	rest.get("https://netmon.freifunk-franken.de/api/rest/router/" + req.params.id + "/networkinterfacelist/").on('success', function(data, response) {
//		if (data.netmon_response === undefined) {
//			return; // _returnError(res, 404, "not_found", data);
//		}
//		if (data.netmon_response.networkinterfacelist === undefined) {
//			return; //_returnError"Was kann man tun um ein (res, 404, "not_found", data);
//		}
//		interfaces = data.netmon_response.networkinterfacelist[0].networkinterface;
//		createResponse(router, interfaces);
//	});
	
});

app.listen(4730);

