/**
 * <p>A scene node that defines an element of geometry.</p>
 * @class SceneJS.Geometry
 * @extends SceneJS.Node
 * <p><b>Live Examples</b></p>
 * <ul><li><a target = "other" href="http://bit.ly/scenejs-geometry-example">Example 1</a></li></ul>
 * <p><b>Example Usage</b></p><p>Definition of a cube, with normals and UV texture coordinates, with coordinates shown here only for the first face:</b></p><pre><code>
 * var g = new SceneJS.Geometry({
 *
 *        // Mandatory primitive type - "points", "lines", "line-loop", "line-strip", "triangles",
 *        // "triangle-strip" or "triangle-fan".
 *
 *        primitive: "triangles",
 *
 *        // Mandatory vertices - eight for our cube, each one spaining three array elements for X,Y and Z
 *
 *        positions : [
 *
 *            // Front cube face - vertices 0,1,2,3
 *
 *            5, 5, 5,
 *            -5, 5, 5,
 *            -5,-5, 5,
 *            5,-5, 5,
 *
 *            //...
 *        ],
 *
 *        // Optional normal vectors, one for each vertex. If you omit these, then cube will not be shaded.
 *
 *        normals : [
 *
 *            // Vertices 0,1,2,3
 *
 *            0, 0, -1,
 *            0, 0, -1,
 *            0, 0, -1,
 *            0, 0, -1,
 *
 *            //...
 *        ],
 *
 *        // Optional 2D texture coordinates corresponding to the 3D positions defined above -
 *        // eight for our cube, each one spanning two array elements for X and Y. If you omit these, then the cube
 *        // will never be textured.
 *
 *        uv : [
 *
 *            // Vertices 0,1,2,3
 *
 *            5, 5,
 *            0, 5,
 *            0, 0,
 *            5, 0,
 *
 *            // ...
 *        ],
 *
 *        // Optional coordinates for a second UV layer - just to illustrate their availability
 *
 *        uv2 : [
 *
 *        ],
 *
 *        // Mandatory indices - these organise the positions, normals and uv texture coordinates into geometric
 *        // primitives in accordance with the "primitive" parameter, in this case a set of three indices for each triangle.
 *        // Note that each triangle in this example is specified in counter-clockwise winding order. You can specify them in
 *        // clockwise order if you configure the SceneJS.renderer node's frontFace property as "cw", instead of the
 *        // default "ccw".
 *
 *        indices : [
 *
 *            // Vertices 0,1,2,3
 *
 *            0, 1, 2,
 *            0, 2, 3,
 *
 *            // ...
 *        ]
 * });
 *  </pre></code>
 * @constructor
 * Create a new SceneJS.Geometry
 * @param {Object} config The config object, followed by zero or more child nodes
 */
SceneJS.Geometry = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "geometry";
    this._geo = null;  // Holds geometry when configured as given arrays
    this._create = null; // Callback to create geometry
    this._type = null; // Optional geometry type ID
    this._handle = null; // Handle to created geometry
};

SceneJS._utils.inherit(SceneJS.Geometry, SceneJS.Node);

// @private
SceneJS.Geometry.prototype._render = function(traversalContext, data) {
    if (!this._geo && !this._create) {

        /* This is a dynamically-configured node
         */
        var params = this._getParams(data);
        if (this._init) {

            /* Subclass implements an init method which will set
             * _geo or _create on this node
             */
            this._init(params);
        } else {

            /* Geometry provided in params
             */
            this._type = params.type;                  // Optional - can be null
            if (params.create instanceof Function) {
                this._create = params.create;
            } else {
                this._geo = {
                    positions : params.positions || [],
                    normals : params.normals || [],
                    colors : params.colors || [],
                    indices : params.indices || [],
                    uv : params.uv || [],
                    primitive : params.primitive || "triangles"
                };
            }
        }
        this._handle = null;
    }
    if (this._handle) { // Was created before - test if not evicted since
        if (!SceneJS_geometryModule.testGeometryExists(this._handle)) {
            this._handle = null;
        }
    }
    if (!this._handle) { // Either not created yet or has been evicted
        if (this._create) { // Use callback to create
            this._handle = SceneJS_geometryModule.createGeometry(this._type, this._create());
        } else { // Or supply arrays
            this._handle = SceneJS_geometryModule.createGeometry(this._type, this._geo);
        }
    }
    SceneJS_geometryModule.drawGeometry(this._handle);
    this._renderNodes(traversalContext, data);
};

/** Function wrapper to support functional scene definition
 */
SceneJS.geometry = function() {
    var n = new SceneJS.Geometry();
    SceneJS.Geometry.prototype.constructor.apply(n, arguments);
    return n;
};
