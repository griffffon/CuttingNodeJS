/**
 * Created by gzelinskiy on 16.07.17.
 */
function Detail(id, name, description, anyzotropy, demand, depth, width, height, points) {
    //Data
    this.id = id;
    this.name = name;
    this.description = description;
    this.anyzotropy = anyzotropy;
    this.demand = demand;
    this.depth = depth;
    this.width = width;
    this.height = height;
    this.points = points;
    this.polarPoint = {x: 0, y: 0};
    this.Borders = {
        numTop   : 0,
        numBottom: 0,
        numLeft  : 0,
        numRight : 0,
        top      : [],
        bottom   : [],
        left     : [],
        right    : []
    };

    //Methods
    this.updatePolarPoint = function () {
        var oldPoint = {
            x: this.polarPoint.x,
            y: this.polarPoint.y
        };

        var maxX = 0;
        var minX = 0;
        var maxY = 0;
        var minY = 0;
        this.points.forEach(function (point) {
            if (maxX < point.x) {
                maxX = point.x;
            }

            if (maxY < point.y) {
                maxY = point.y;
            }

            if (minX > point.x) {
                minX = point.x;
            }

            if (minY > point.y) {
                minY = point.y;
            }
        });

        this.polarPoint = {
            x: ((maxX + minX) / 2),
            y: ((maxY + minY) / 2)
        };

        //Update points
        /*var deltaX = 0, deltaY = 0;
        deltaX = oldPoint.x - this.polarPoint.x;
        deltaY = oldPoint.y - this.polarPoint.y;

        for (var i = 0; i < this.points.length; i++) {
            this.points[i] = {
                x: this.points[i].x + deltaX,
                y: this.points[i].y - deltaY
            };
        }*/

        //this.getBorders();
    };


    this.setPolarPoint = function (x, y) {
        var deltaX = 0, deltaY = 0;
        deltaX = x - this.polarPoint.x;
        deltaY = y - this.polarPoint.y;

        this.polarPoint = {
            x: x,
            y: y
        };

        //Update points
        for (var i = 0; i < this.points.length; i++) {
            this.points[i] = {
                x: this.points[i].x + deltaX,
                y: this.points[i].y - deltaY
            };
        }

        //Update borders
        this.getBorders();
        /*for (var i = 0; i < this.Borders.top.length; i++) {
            this.Borders.top[i] = {
                x: this.Borders.top[i].x + deltaX,
                y: this.Borders.top[i].y - deltaY
            };
        }

        for (var i = 0; i < this.Borders.bottom.length; i++) {
            this.Borders.bottom[i] = {
                x: this.Borders.bottom[i].x + deltaX,
                y: this.Borders.bottom[i].y - deltaY
            };
        }

        for (var i = 0; i < this.Borders.left.length; i++) {
            this.Borders.left[i] = {
                x: this.Borders.left[i].x + deltaX,
                y: this.Borders.left[i].y - deltaY
            };
        }

        for (var i = 0; i < this.Borders.right.length; i++) {
            this.Borders.right[i] = {
                x: this.Borders.right[i].x + deltaX,
                y: this.Borders.right[i].y - deltaY
            };
        }*/
    };

    this.getBorders = function () {
        this.updatePolarPoint();
        var minXnum = this.getMinXNum();
        var maxXnum = this.getMaxXNum();
        var minYnum = this.getMinYNum();
        var maxYnum = this.getMaxYNum();
        this.getTopAndBottomBorders(minXnum, maxXnum);
        this.getLeftAndRightBorders(minYnum, maxYnum);
    };

    this.getMinX = function () {
        var min = this.points[0].x;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].x < min) {
                min = this.points[i].x;
            }
        }
        return min;
    };

    this.getMaxX = function () {
        var max = this.points[0].x;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].x >= max) {
                max = this.points[i].x;
            }
        }
        return max;
    };

    this.getMinY = function () {
        var min = this.points[0].y;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].y < min) {
                min = this.points[i].y;
            }
        }
        return min;
    };

    this.getMaxY = function () {
        var max = this.points[0].y;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].y >= max) {
                max = this.points[i].y;
            }
        }
        return max;
    };

    this.getMinXNum = function () {
        var min = this.points[0].x;
        var n = 0;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].x < min) {
                min = this.points[i].x;
                n = i;
            }
        }
        return n;
    };

    this.getMaxXNum = function () {
        var max = this.points[0].x;
        var n = 0;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].x >= max) {
                max = this.points[i].x;
                n = i;
            }
        }
        return n;
    };

    this.getMinYNum = function () {
        var min = this.points[0].y;
        var n = 0;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].y < min) {
                min = this.points[i].y;
                n = i;
            }
        }
        return n;
    };

    this.getMaxYNum = function () {
        var max = this.points[0].y;
        var n = 0;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].y >= max) {
                max = this.points[i].y;
                n = i;
            }
        }
        return n;
    };

    this.getTopAndBottomBorders = function (numInfPointX, numExtPointX) {
        var numBottom1 = 0, numTop1 = 0;
        if (numInfPointX > numExtPointX) {
            this.Borders.numTop = numInfPointX - numExtPointX + 1;

            for (var j = 0; j < this.Borders.numTop; j++) {
                this.Borders.top.push({
                    x: this.points[numExtPointX + j].x,
                    y: this.points[numExtPointX + j].y
                });
            }

            numBottom1 = this.points.length - numInfPointX;

            for (var j = 0; j < numBottom1; j++) {
                this.Borders.bottom.push({
                    x: this.points[numInfPointX + j].x,
                    y: this.points[numInfPointX + j].y
                });
            }

            for (var j = 0; j < numExtPointX; j++) {
                this.Borders.bottom.push({
                    x: this.points[j].x,
                    y: this.points[j].y
                });
            }

            this.Borders.numBottom = numBottom1 + numExtPointX;
        } else {
            numTop1 = this.points.length - numExtPointX;
            //numTop1 = Count - numExtPointX - 1;

            for (var j = 0; j < numTop1; j++) {
                this.Borders.top.push({
                    x: this.points[numExtPointX + j].x,
                    y: this.points[numExtPointX + j].y
                });
            }

            for (var j = 0; j < numInfPointX; j++) {
                this.Borders.top.push({
                    x: this.points[j].x,
                    y: this.points[j].y
                });
            }

            this.Borders.numTop = numTop1 + numInfPointX;
            this.Borders.numBottom = numExtPointX - numInfPointX + 1;

            for (var j = 0; j < this.Borders.numBottom; j++) {
                this.Borders.bottom.push({
                    x: this.points[numInfPointX + j].x,
                    y: this.points[numInfPointX + j].y
                });
            }
        }
    };

    this.getLeftAndRightBorders = function (numInfPointY, numExtPointY) {
        var numLeft1 = 0, numRight1 = 0;
        if (numInfPointY > numExtPointY) {
            this.Borders.numLeft = numInfPointY - numExtPointY + 1;

            for (var j = 0; j < this.Borders.numLeft; j++) {
                this.Borders.left.push({
                    x: this.points[numExtPointY + j].x,
                    y: this.points[numExtPointY + j].y
                });
            }

            numRight1 = this.points.length - numInfPointY;

            for (var j = 0; j < numRight1; j++) {
                this.Borders.right.push({
                    x: this.points[numInfPointY + j].x,
                    y: this.points[numInfPointY + j].y
                });
            }

            for (var j = 0; j < numExtPointY; j++) {
                this.Borders.right.push({
                    x: this.points[j + 1].x,
                    y: this.points[j + 1].y
                });
            }

            this.Borders.numRight = numRight1 + numExtPointY;
        } else {
            numLeft1 = this.points.length - numExtPointY;

            for (var j = 0; j < numLeft1; j++) {
                this.Borders.left.push({
                    x: this.points[numExtPointY + j].x,
                    y: this.points[numExtPointY + j].y
                });
            }

            for (var j = 0; j < numInfPointY; j++) {
                this.Borders.left.push({
                    x: this.points[j + 1].x,
                    y: this.points[j + 1].y
                });
            }

            //Borders.numRight += numInfPointY;
            this.Borders.numLeft = numExtPointY - numInfPointY + 1;

            for (var j = 0; j < this.Borders.numLeft; j++) {
                this.Borders.right.push({
                    x: this.points[numInfPointY + j].x,
                    y: this.points[numInfPointY + j].y
                });
            }

            this.Borders.numRight = this.Borders.right.length;
        }
    };

    this.rotate = function (alpha) {
        //not tested
        for (var i = 0; i < this.points.length; i++) {
            this.points[i] = {
                x: Math.round(this.points[i].x * Math.cos((alpha * Math.PI) / 180) - this.points[i].y * Math.sin((alpha * Math.PI) / 180)),
                y: Math.round(this.points[i].x * Math.sin((alpha * Math.PI) / 180) + this.points[i].y * Math.cos((alpha * Math.PI) / 180))
            };
        }
        this.getBorders();
    };
}

exports.Detail = Detail;