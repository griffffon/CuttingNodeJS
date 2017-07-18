/**
 * Created by gzelinskiy on 16.07.17.
 */
function Material(width, height, depth) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.square = this.width * this.height;
}

exports.Material = Material;