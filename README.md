# api.franken.freifunk.net #

Das Server-Skript started einen Webserver (Port 9001) der eine Libremap-Kompatieble API bereitstellt.
Die Datensätze, die diese API bereitstellt können direkt in Libremap gepushed werden.
Das Skript kümmert sich automatisch um das pageing und liefert (nach einer ganzen Weile warten) z.B. eine Liste mit allen Knoten und deren Infos zurück.


## Setup ##
```
/> npm install express moment xml2js restler xml2js async
/> node server.js
```


## Examples ##
```
http://localhost:9001/nodes
http://localhost:9001/node/:netmon-id
http://localhost:9001/nodes?status=online
```

## TODO ##
* Verbindungen zwichen Konten fehlt noch
* Infos zu den Interfaces fehlt noch
* Chaching !?
* API > 1.0 untersützen
* package.json pflegen
