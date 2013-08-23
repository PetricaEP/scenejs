/**
 * Container of physics systems
 */
define(
    function () {

        // Physics systems
        var items = {};

        return  {

            /**
             * Acquire a physics system for the given SceneJS scene, creating first if not existing
             * @param {SceneJS.Scene} scene
             */
            getSystem:function (scene) {
                var systemId = scene.getId();
                var item = items[systemId];
                if (item) {
                    item.useCount++;
                    return item.system;
                }
                var system = new System(systemId);
                item = items[systemId] = {
                    useCount:1,
                    system:system,
                    scene:scene,
                    tick:scene.on("tick", // Start integrating the system on scene tick
                        function () {
                            system.integrate();
                        })
                };
                return system;
            },

            /**
             * Release a physics system, destroying it if no more users
             * @param {System} system
             */
            putSystem:function (system) {
                var item = items[system.systemId];
                if (item) {
                    if (item.useCount-- <= 0) {
                        item.scene.off(item.tick); // Stop integrating the system
                        delete items[system.systemId];
                    }
                }
            }
        };

        /**
         * A physics system
         */
        function System(systemId) {

            this.systemId = systemId;

            var bodies = [];
            var map = new Map(bodies);

            // Create physics engine in worker
            var workerPath = SceneJS.getConfigs().pluginPath + "/lib/physics/worker.js";
            var worker = new Worker(workerPath);

            // Route updates from physics engine to bodies
            worker.addEventListener('message',
                function (e) {
                    var updates = e.data;
                    var body;
                    var offset = 0;
                    for (var i = 0, len = bodies.length; i < len; i++) {
                        body = bodies[i];
                        if (body) { // May have been deleted
                            body.callback(
                                updates.slice(offset, offset + 3), // Pos
                                updates.slice(offset + 3, offset + 19)); // Rotation matrix
                        }
                        offset += 19; // Pos and matrix elements
                    }
                }, false);

            /**
             * Creates physics body, returns it's unique ID
             * @param params Body params
             * @param callback Callback fired whenever body updated
             * @return Body ID
             */
            this.createBody = function (params, callback) {
                var bodyId = map.add({
                    callback:callback
                });
                worker.postMessage({ cmd:"createBody", bodyId:bodyId, body:params });
                return bodyId;
            };

            /**
             * Removes physics body
             */
            this.removeBody = function (bodyId) {
                worker.postMessage({ cmd:"removeBody", bodyId:bodyId });
                map.remove(bodyId);
            };

            /**
             * Integrates this physics system
             */
            this.integrate = function () {
                worker.postMessage({ cmd:"integrate" });
            };
        }

        /**
         * Uniquely ID'd map of items
         * @param items Array that will contain the items
         */
        function Map(items) {
            var lastUniqueId = 1;
            this.add = function (item) {
                while (true) {
                    var findId = lastUniqueId++;
                    if (!items[findId]) {
                        items[findId] = item;
                        return findId;
                    }
                }
            };
            this.remove = function (id) {
                delete items[id];
            };
        }
    });