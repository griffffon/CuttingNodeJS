/**
 * Created by gzelinskiy on 16.07.17.
 */
function Row(detail, material, options) {
    //Data
    this.templateDetail = detail;
    this.material = material;
    this.details = [];
    this.points = [];
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

    this.updatePointsArray = function () {
        var points = this.points;
        this.points = [];

        this.details.forEach(function (detail) {
            detail.points.forEach(function (point) {
                points.push(point);
            })
        });

        this.points = points;
    };

    this.getMinX = function () {
        var min = this.points[0].x;
        for (var i = 1; i < this.points.length; i++) {
            if (this.points[i].x <= min) {
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
            if (this.points[i].y > max) {
                max = this.points[i].y;
            }
        }
        return max;
    };

    this.getWidth = function () {
        if (this.details.length === 0) return 0;
        var min = this.details[0].getMinX();
        var max = this.details[this.details.length - 1].getMaxX();
        return Math.abs(max - min);
    };

    this.getHeight = function () {
        if (this.details.length === 0) return 0;
        var min = this.details[0].getMinY();
        var max = this.details[this.details.length - 1].getMaxY();
        return Math.abs(max - min);
    };

    this.getBorders = function () {
        var xMin = this.getMinX();
        var xMax = this.getMaxX();
        var yMin = this.getMinY();
        var yMax = this.getMaxY();

        var Points = this.points;

        //верхняя граница
        for (var i = 0; i < Points.length; i++) {
            //точки перпендикуляра
            var A1 = {x: Points[i].x, y: yMax};
            var B1 = {x: Points[i].x, y: Points[i].y};

            var points1 = [];
            // points1 = Points.Where(p => p.X == A1.X).ToList();
            Points.forEach(function (p) {
                if (p.x === A1.x) {
                    points1.push(p);
                }
            });

            //точки перпендикуляра
            var A2 = {x: Points[i].x, y: yMin};
            var B2 = {x: Points[i].x, y: Points[i].y};

            var points2 = [];
            // points2 = Points.Where(p => p.X == A2.X).ToList();
            Points.forEach(function (p) {
                if (p.x === A2.x) {
                    points2.push(p);
                }
            });

            //точки перпендикуляра
            var A3 = {x: xMin, y: Points[i].y};
            var B3 = {x: Points[i].x, y: Points[i].y};

            var points3 = [];
            // points3 = Points.Where(p => p.Y == A3.Y).ToList();
            Points.forEach(function (p) {
                if (p.y === A3.y) {
                    points3.push(p);
                }
            });

            //точки перпендикуляра
            var A4 = {x: xMax, y: Points[i].y};
            var B4 = {x: Points[i].x, y: Points[i].y};

            var points4 = [];
            // points4 = Points.Where(p => p.Y == A4.Y).ToList();
            Points.forEach(function (p) {
                if (p.y === A4.y) {
                    points4.push(p);
                }
            });

            //проверяем пересечение перпендикуляра с каждой линией
            var count1 = 0;
            var count2 = 0;
            var count3 = 0;
            var count4 = 0;
            for (var j = 1; j < Points.length; j++) {
                if (CrossingSegment(A1, B1, Points[j - 1], Points[j])) {
                    count1++;
                }

                if (CrossingSegment(A2, B2, Points[j - 1], Points[j])) {
                    count2++;
                }

                if (CrossingSegment(A3, B3, Points[j - 1], Points[j])) {
                    count3++;
                }

                if (CrossingSegment(A4, B4, Points[j - 1], Points[j])) {
                    count4++;
                }
            }

            points1.forEach(function (p) {
                if (p.y > Points[i].y) {
                    count1++;
                }
            });

            points2.forEach(function (p) {
                if (p.y < Points[i].y) {
                    count2++;
                }
            });

            points3.forEach(function (p) {
                if (p.y < Points[i].y) {
                    count3++;
                }
            });

            points4.forEach(function (p) {
                if (p.y < Points[i].y) {
                    count4++;
                }
            });

            if (count1 === 0) {
                this.Borders.top.push(Points[i]);
                this.Borders.numTop++;
            }

            if (count2 === 0) {
                this.Borders.bottom.push(Points[i]);
                this.Borders.numBottom++;
            }

            if (count3 === 0) {
                this.Borders.left.push(Points[i]);
                this.Borders.numLeft++;
            }

            if (count4 === 0) {
                this.Borders.right.push(Points[i]);
                this.Borders.numRight++;
            }
        }

        this.Borders.top = this.Borders.top.filter(onlyUnique);
        this.Borders.numTop = this.Borders.top.length;
        this.Borders.top = this.Borders.top.sort(sortByXThenByY);

        /*Borders.top = Borders.top.Distinct().ToList();
        Borders.numTop = Borders.top.Count;
        Borders.top = Borders.top.OrderBy(point => point.X).ThenBy(point => point.Y).ToList();*/

        /*Borders.bottom = Borders.bottom.Distinct().ToList();
        Borders.numBottom = Borders.bottom.Count;
        Borders.bottom = Borders.bottom.OrderBy(point => point.X).ThenBy(point => point.Y).ToList();*/

        this.Borders.bottom = this.Borders.bottom.filter(onlyUnique);
        this.Borders.numBottom = this.Borders.bottom.length;
        this.Borders.bottom = this.Borders.bottom.sort(sortByXThenByY);

        /*    Borders.left = Borders.left.Distinct().ToList();
        Borders.numLeft = Borders.left.Count;
        Borders.left = Borders.left.OrderBy(point => point.Y).ThenBy(point => point.X).ToList();*/

        this.Borders.left = this.Borders.left.filter(onlyUnique);
        this.Borders.numLeft = this.Borders.left.length;
        this.Borders.left = this.Borders.left.sort(sortByXThenByY);

        /*Borders.right = Borders.right.Distinct().ToList();
        Borders.numRight = Borders.right.Count;
        Borders.right = Borders.right.OrderBy(point => point.Y).ThenBy(point => point.X).ToList();*/

        this.Borders.right = this.Borders.right.filter(onlyUnique);
        this.Borders.numRight = this.Borders.right.length;
        this.Borders.right = this.Borders.right.sort(sortByXThenByY);
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

function CrossingSegment(p1, p2, p3, p4) {
    var A1 = 0, A2 = 0, B1 = 0, B2 = 0, C1 = 0, C2 = 0, D = 0, Da = 0, Db = 0, Dc = 0, Dd = 0, Dx = 0, Dy = 0;
    var isCrossing = false;

    A1 = p2.y - p1.y;
    B1 = p1.x - p2.x;
    C1 = p2.x * p1.y - p1.x * p2.y;
    A2 = p3.y - p4.y;
    B2 = p4.x - p3.x;
    C2 = p3.x * p4.y - p4.x * p3.y;
    Da = A2 * p1.x + B2 * p1.y + C2;
    Db = A2 * p2.x + B2 * p2.y + C2;
    Dc = A1 * p3.x + B1 * p3.y + C1;
    Dd = A1 * p4.x + B1 * p4.y + C1;

    if ((Da * Db < 0) && (Dc * Dd < 0)) {
        isCrossing = true;
        D = A1 * B2 - A2 * B1;
        if (D === 0) {
            isCrossing = false;
        }
        /*if (D !== 0)
        {
            Dx = C2 * B1 - C1 * B2;
            Dy = A2 * C1 - A1 * C2;
            //pOut.X = (int)(Dx / D);
            //pOut.Y = (int)(Dy / D);
        }
        else
        {
            isCrossing = false;
        }*/
    } else {
        isCrossing = false;
    }

    return isCrossing;
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function sortByXThenByY(a, b) {
    var n = a.x - b.x;
    if (n !== 0) {
        return n;
    }

    return a.y - b.y;
}

exports.Row = Row;