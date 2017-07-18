/**
 * Created by gzelinskiy on 16.07.17.
 */
function Row(detail, material, options) {
    //Data
    this.templateDetail = detail;
    this.material = material;
    this.details = [];
    this.borders = [];
    this.width = 0;
    this.height = 0;
    this.options = options;
    this.startPoint = {
        x: 0,
        y: 0
    };

    //Methods
    this.add = function () {
        //суміщення в ряду однаково орієнтованих деталей (додавання деталі і суміщення)
        var detWidth = parseFloat(this.templateDetail.width);
        var detHeight = parseFloat(this.templateDetail.height);
        var rowWidth = parseFloat(this.width);
        var rowHeight = parseFloat(this.height);

        if (((parseFloat(material.width) - rowWidth) >= (detWidth + parseFloat(this.options.detailsBridge))) && ((parseFloat(material.height) - rowHeight) >= (detHeight + parseFloat(this.options.detailsBridge)))) {
            var detail = clone(this.templateDetail); //new object without reference
            // var detail = JSON.parse(JSON.stringify(this.templateDetail)); //new object without reference
            detail.updatePolarPoint();

            if (this.details.length === 0) {
                //додавання першої деталі в ряд
                var deltaX = this.templateDetail.width / 2;
                var deltaY = this.templateDetail.height / 2;
                for (var i = 0; i < this.templateDetail.points.length; i++) {
                    detail.points[i] = {
                        x: this.startPoint.x + this.templateDetail.points[i].x + deltaX/* + Data.delta_edge*/,
                        y: -this.startPoint.y + this.templateDetail.points[i].y + deltaY/*- Data.delta_edge*/
                    };
                }
            } else {
                var shiftValue = this.shift();

                for (var i = 0; i < detail.points.length; i++) {
                    detail.points[i] = {
                        x: this.details[this.details.length - 1].points[i].x + parseFloat(shiftValue) + parseFloat(options.detailsBridge),
                        y: this.details[this.details.length - 1].points[i].y
                    };
                }
            }

            detail.updatePolarPoint();
            detail.getBorders();
            this.details.push(detail);
            this.updateWidth();
            this.updateHeight();
            return true;
        }
        else {
            return false;
        }
    };

    this.shift = function () {
        var d1 = clone(this.templateDetail);
        var d2 = clone(this.templateDetail);

        // d1.getBorders();
        d1.updatePolarPoint();
        d1.getBorders();
        d2.getBorders();
        d2.setPolarPoint(d1.polarPoint.x + 1, d1.polarPoint.y);

        var shiftX = 0;
        var valA2 = Math.abs(this.shiftX(d2, d1, true));
        var valB2 = Math.abs(this.shiftX(d1, d2, false));
        if (valB2 > valA2) {
            shiftX = valB2;
        } else {
            shiftX = valA2;
        }

        return shiftX;
    };

    this.shiftX = function (d1, d2, flag) {
        //d1 - левая деталь
        //d2 - правая деталь
        var result = 0;
        var eps = 0.001;
        var y1, y2, result1, x_shift;

        for (var i = 0; i < d2.Borders.left.length; i++) {
            for (var j = 0; j < d1.Borders.right.length - 1; j++) {
                if (Math.abs(d1.Borders.right[j].y - d1.Borders.right[j + 1].y) <= eps) continue;

                if (d1.Borders.right[j].y > d1.Borders.right[j + 1].y) {
                    y1 = d1.Borders.right[j + 1].y;
                    y2 = d1.Borders.right[j].y;
                } else {
                    y1 = d1.Borders.right[j].y;
                    y2 = d1.Borders.right[j + 1].y;
                }

                if ((d2.Borders.left[i].y <= y2) && (d2.Borders.left[i].y >= y1)) {
                    //x_shift = d1.Borders.right[j].X + ((d2.Borders.left[i].X - d2.Borders.left[i].X) * d1.Borders.right[j].Y + (d2.Borders.left[i].X * d2.Borders.left[i + 1].Y - d2.Borders.left[i + 1].X * d2.Borders.left[i].Y)) / (d2.Borders.left[i + 1].Y - d2.Borders.left[i].Y);
                    x_shift = d1.Borders.right[j].x + (d1.Borders.right[j + 1].x - d1.Borders.right[j].x) * (d2.Borders.left[i].y - d1.Borders.right[j].y) / (d1.Borders.right[j + 1].y - d1.Borders.right[j].y);
                    //x_shift = Math.Abs(d1.Borders.right[j].X + ((d2.Borders.left[i].X - d2.Borders.left[i].X) * d1.Borders.right[j].Y + (d2.Borders.left[i].X * d2.Borders.left[i + 1].Y - d2.Borders.left[i + 1].X * d2.Borders.left[i].Y)) / (d2.Borders.left[i + 1].Y - d2.Borders.left[i].Y));

                    if (!flag) {
                        result1 = x_shift - d2.Borders.left[i].x;
                    } else {
                        result1 = d2.Borders.left[i].x - x_shift;
                    }

                    if (result1 > result) {
                        result = result1;
                    }
                }
            }
        }
        return result;
    };

    this.updateWidth = function () {
        if (this.details.length === 0) {
            return 0;
        }

        var min = this.details[0].getMinX();
        var max = this.details[this.details.length - 1].getMaxX();
        this.width = Math.abs(max - min);
    };

    this.updateHeight = function () {
        if (this.details.length === 0) {
            return 0;
        }

        var min = this.details[0].getMinY();
        var max = this.details[this.details.length - 1].getMaxY();
        this.height = Math.abs(max - min);
    };
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

exports.Row = Row;