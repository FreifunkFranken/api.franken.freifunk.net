var cradle = require('cradle');
var rest = require('restler');
var async = require('async');

cradle.setup({
	host: '95.85.40.145',
	auth: { username: 'root', password: 'AlexW.9480' },
	cache: false,
	raw: false,
	retries: 3,
	retryTimeout: 10 * 1000
});

var nodes2couchdb = function() {
	
	//Private
	var connection = new(cradle.Connection);
	var db = connection.database('libremap-dev');
	
	function showError(msg) {
		console.log("ERROR in nodes2couchdb: ", msg);
		return msg;
	}
	
	//Public
	return({
		
		/**
		 * TODO
		 */
		init: function(callback) {
			db.exists(function (err, exists) {
				if (err) {
					showError(err);
					callback(false);
				} else if (exists) {
					//console.log('Yeah! The database exists');
					callback(true);
				} else {
					showError('database does not exists.');
					//db.create();
					/*TODO populate design documents */
					callback(false);
				}
			});
		},
		
		/**
		 * TODO
		 */
		getRoutersFromNetmon: function(callback) {
//			var routers = [];
//			routers = require('./nodes.json');
//			callback(routers);
			rest.get('http://localhost:9001/nodes?status=online').once('success', function(data, response) {
				callback(data);
			});
		},
		
		/**
		 * TODO
		 */
		createTempView: function(callback) {
			db.temporaryView({
				map: function (doc) { 
					if (doc.type === "router") { 
						emit(doc.hostname, { 
							_rev: doc._rev,
							ctime: doc.ctime
						})
					} 
				}
			}, function (err, res) {
				if (err) {
					console.log(err);
					return
				}
				//console.log(res);
				callback();
			});
		},
		
		/**
		 * TODO
		 */
		getNodesByHostname: function(hostname, callback) {
			db.view('libremap-api/routers_by_site', { key: hostname }, function (err, doc) {
				if (err) return showError(err);
				callback(doc.rows);
			});
		},
		
		/**
		 * TODO
		 */
		getNodesByNetmonId: function(netmonId, callback) {
			db.view('libremap-api/routers_by_netmonid', { key: netmonId }, function (err, doc) {
				if (err) return showError(err);
				callback(doc.rows);
			});
		},
		
		/**
		 * TODO
		 */
		saveDocument: function(doc, callback) {
			db.save(doc, 
				function (err, res) {
					if (err) return showError(err);
					callback(res.id);
				});
		},
		
		/**
		 * TODO
		 */
		updateDocument: function(id, doc, callback) {
			db.merge(id, doc, function (err, res) {
				if (err) return showError(err);
				callback(res._rev);
			});
		}
	});
	 
};

function updateNodes2couchdb() {
	var n2c = nodes2couchdb();
	n2c.init(function(exists) {
		if (!exists) return;
			
		n2c.getRoutersFromNetmon(function(routers) {
			if (!routers || routers.length <= 0) 
				return console.log("ERROR: netmon API returned no routers");
			
			
			function updateRouter(router) {
				if (!router.hostname || router.hostname.length <= 0) return;
				
				//n2c.getNodesByHostname(router.hostname, function(doc) {
				n2c.getNodesByNetmonId(router.attributes.netmon.id, function(doc) {
					if (doc.length === 1) {
						//router already exists in the DB
						
						//console.log(doc[0]);
						console.log("router \"" + router.hostname + "\" already exists in the DB");
						
						router._rev = doc[0]._rev;
						delete router.ctime;
						delete router.id;
						
						n2c.updateDocument(doc[0].id, router, function(rev) {
							console.log("document updated: ", rev);
						});
						
					} else if (doc.length > 1){
						
						console.log("WARN: multible routers with the same name found: ", docs);
						
					} else {
						
						//router does not yet exis in the DB
						console.log("router \"" + router.hostname + "\" not found");
						n2c.saveDocument(router, function(id) {
							console.log("document creaded: ", id);
						});
						
					}
				});
			}
			
	//		updateRouter(routers[0]);
			routers.forEach(function(router) {
				updateRouter(router);
			});
		});
		
	});
}

updateNodes2couchdb();

//update every 15n minutes
setInterval(function(){
	updateNodes2couchdb();
}, 15 * 60000);