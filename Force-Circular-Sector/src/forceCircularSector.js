// https://github.com/ChanKaion/AnyT-d3-Repository/blob/master/Force-Circular-Sector
(function (global, factory) {
    (factory((global.d3 = global.d3 || {}), global.d3))
}(this, (function (exports) {
    'use strict';

    function constant(x) {
        return function () {
            return x;
        };
    }

    function forceCircularSector(radiuses, angles) {
        let strength = constant(0.1),
            nodes,
            strengths,
            positions;

        if (angles == null) angles = [0, 360];

        function force(alpha) {
            for (let i = 0, n = nodes.length, node; i < n; ++i) {
                node = nodes[i];
                node.vx += (positions.xz[i] - node.x) * strengths[i] * alpha;
                node.vy += (positions.yz[i] - node.y) * strengths[i] * alpha;
            }
        }

        function initialize() {
            if (!nodes) return;
            let i, n = nodes.length;

            strengths = new Array(n);
            positions = {
                xz: new Array(n),
                yz: new Array(n)
            };

            let result = calculatePosition();
            positions.xz = result.x;
            positions.yz = result.y;

            for (i = 0; i < n; ++i) {
                strengths[i] = +strength(nodes[i], i, nodes);
            }
        }

        function calculatePosition() {
            let i, n = nodes.length;
            let r1 = +radiuses[0],
                r2 = +radiuses[1],
                ang1 = +angles[0],
                ang2 = +angles[1];

            let angleDelta = Math.abs(ang2 - ang1);
            let l = 0, r = r2 - r1, R = r, A = angleDelta / 360, resultNum = 0, resultL = 0;
            while (r - l > 0.1) {
                let d = (l + r) / 2,
                    step = 0,
                    sumD = 0,
                    num = 0;
                while (d * (1 << step) <= R) step += 1;
                while (step >= 0) {
                    if (sumD + d * (1 << step) <= R) {
                        sumD += d * (1 << step);
                        num += (1 << step);
                    } else step -= 1;
                }
                let totalL = 6.2832 * A * (r1 + r1 + sumD + d) * num / 2;
                let singleL = totalL / (n + num);
                if (d > singleL) {
                    r = d;
                } else {
                    l = d;
                }
                resultNum = num;
                resultL = singleL;
            }

            let x = [], y = [], leftL = new Map();
            r = r1;
            for (i = 1; i <= resultNum; i++) {
                r += l;
                let unitA = (resultL / 6.2832 / r) * 360,
                    c = 6.2832 * r * angleDelta / 360,
                    num = Math.floor(c / resultL) - 1;
                leftL.set(r, c - num * resultL);
                A = ang1;
                for (let j = 0; j < num; j++) {
                    A += unitA;
                    x.push(r * Math.cos(A * Math.PI / 180));
                    y.push(r * Math.sin(A * Math.PI / 180));
                }
            }
            let arr = Array.from(leftL);
            arr.sort((a, b) => b[1] - a[1]);
            let num = n - x.length;
            for (i = 0; i < num; i++) {
                x.push(arr[i][0] * Math.cos(ang1 * Math.PI / 180));
                y.push(arr[i][0] * Math.sin(ang1 * Math.PI / 180));
            }

            return {x, y}
        }

        force.initialize = function (_) {
            nodes = _;
            initialize();
        };

        force.strength = function (_) {
            return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
        };

        force.radiuses = function (_) {
            return arguments.length ? (radiuses = _, initialize(), force) : radiuses;
        };

        force.angles = function (_) {
            return arguments.length ? (angles = _, initialize(), force) : angles;
        };


        return force;
    }

    exports.forceCircularSector = forceCircularSector;

    Object.defineProperty(exports, '__esModule', {value: true});

})));
