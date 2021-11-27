/**
 * 初始化 SVG & Canvas 画布元素
 * renderParams 参数对象，包括 radius节点半径，width 渲染元素宽度和 height 渲染元素高度
 * @returns {*} d3 画布元素对象以及缩放对象
 */
const initRenderSettings = (renderParams) => {
    let {width, height} = renderParams;

    // 定义 svg 元素
    let svgContainer = d3.select('.graphContainer')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid #cccccc');
    let renderSVG = svgContainer.append('g');
    d3.select('.graphContainer')
        .append('span')
        .classed('span-tip', true)
        .text('svg')
        .style('left', '10px')
        .style('top', '5px');

    // 定义 canvas 元素
    let renderCanvas = d3.select(".graphContainer")
        .append("canvas")
        .attr("width", width)
        .attr("height", height)
        .style('border', '1px solid #cccccc');
    let ctx = renderCanvas.node().getContext("2d");
    d3.select('.graphContainer')
        .append('span')
        .classed('span-tip', true)
        .text('canvas')
        .style('left', `${width + 10}px`)
        .style('top', '5px');

    // 禁用浏览器原始右键菜单
    document.oncontextmenu = () => false;

    return {renderSVG, ctx};
};

/**
 * 渲染 SVG 图谱
 * @param renderSVG 渲染的SVG画布元素
 * @param renderParams 图谱绘制参数对象
 */
const renderGraphBasedOnSVG = (renderSVG, renderParams) => {
    // 图谱参数
    let {radius, width, height, margin} = renderParams;
    // 图谱实例对象
    let graphInstance = {};

    d3.json('./dataset/miserables.json').then(data => {
        // 设置 SVG 渲染容器和点边数据
        graphInstance.containerEL = renderSVG;
        graphInstance.nodes = [...data.nodes];
        graphInstance.edges = [...data.edges];

        // 绘制点边
        renderEdges(graphInstance, true);
        renderNodes(graphInstance, true);

        // 定义放缩函数对象
        let zoomObjectSVG = d3.zoom()
            .scaleExtent([1 / 93.0, 114.22])
            .on('zoom', event => {
                renderSVG.attr('transform', event.transform);
            });

        // 设置力模拟器
        graphInstance.simulation = d3.forceSimulation();
        graphInstance.simulation
            .nodes(graphInstance.nodes)
            .force('charge', d3.forceManyBody())
            .force('link', d3.forceLink(graphInstance.edges).id(d => d.id))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .on('tick', () => {
                graphInstance.nodesEL
                    .attr('transform', d => `translate(${d.x},${d.y})`);
                graphInstance.edgesEL
                    .selectAll('path')
                    .attr('d', d => `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`);
            })
            .on('end', () => {
                console.log('tickend');
            });

        // 绘制完成之后绑定交互事件
        bindEvent(graphInstance);

        /**
         * 绘制连边
         * @param graphInstance 图谱实例对象
         */
        function renderEdges(graphInstance) {
            let containerEl = graphInstance.containerEL
                .append('g')
                .attr('class', 'linksG');

            graphInstance.edgesEL = containerEl
                .selectAll('g')
                .data(graphInstance.edges, d => d.id)
                .enter()
                .append('g')
                .attr('id', d => `linkG-${d.id}`)
                .attr('class', 'linkG');
            const paths = graphInstance.edgesEL
                .append('path')
                .attr('stroke', '#999999')
                .style('stroke-width', 0.75);
        }

        /**
         * 绘制节点
         * @param graphInstance 图谱实例对象
         */
        function renderNodes(graphInstance) {
            let containerEl = graphInstance.containerEL
                .append('g')
                .attr('class', 'nodesG');

            graphInstance.nodesEL = containerEl
                .selectAll('g')
                .data(graphInstance.nodes, d => d.id)
                .enter()
                .append('g')
                .attr('id', d => `nodeG-${d.id}`)
                .attr('class', 'nodeG');
            graphInstance.nodesEL
                .append('circle')
                .attr('stroke', '#ffffff')
                .attr('r', radius)
                .style('fill', '#999999');
        }

        /**
         * 绑定事件
         */
        function bindEvent(graphInstance) {
            // 放缩事件
            d3.select(renderSVG.node().parentNode)
                // 放缩事件
                .call(zoomObjectSVG)
                // 阻止默认的双击放缩事件
                .on('dblclick.zoom', null);

            // 节点交互
            if (graphInstance.nodesEL) {
                graphInstance.nodesEL
                    // 点击
                    .on('click', (event, d) => {
                        console.log('Node', d);
                        event.stopPropagation();
                    })
                    // 拖拽
                    .call(d3.drag()
                        .on('start', (event) => {
                            if (!event.active) graphInstance.simulation.alphaTarget(0.3).restart();
                            event.subject.fx = event.subject.x;
                            event.subject.fy = event.subject.y;
                        })
                        .on('drag', (event) => {
                            event.subject.fx = event.x;
                            event.subject.fy = event.y;
                        })
                        .on('end', (event) => {
                            if (!event.active) graphInstance.simulation.alphaTarget(0);
                            event.subject.fx = null;
                            event.subject.fy = null;
                        })
                    );
            }
        }
    });
};

/**
 * 渲染 Canvas 图谱
 * @param ctx canvas上下文对象
 * @param renderParams 图谱绘制参数对象
 */
const renderGraphBasedOnCanvas = (ctx, renderParams) => {
    // 图谱参数
    let {radius, width, height, margin} = renderParams;
    // 图谱实例对象
    let graphInstance = {};

    d3.json('./dataset/miserables.json').then(data => {
        // 设置 Canvas 渲染容器和点边数据
        graphInstance.containerEL = renderSVG;
        graphInstance.nodes = [...data.nodes];
        graphInstance.edges = [...data.edges];

        // 定义放缩函数对象
        let transform = d3.zoomIdentity;
        let zoomObjectCanvas = d3.zoom()
            .scaleExtent([1 / 93.0, 114.22])
            .on('zoom', (event) => {
                transform = event.transform;
                simulationUpdate();
            });

        // 设置力模拟器
        graphInstance.simulation = d3.forceSimulation();
        graphInstance.simulation.nodes(graphInstance.nodes)
            .force('charge', d3.forceManyBody())
            .force('link', d3.forceLink(graphInstance.edges).id(d => d.id))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .on('tick', () => {
                simulationUpdate();
            })
            .on('end', () => {
                console.log('tickend');
            });

        bindEvent(graphInstance);

        /**
         * canvas 更新式绘制
         */
        function simulationUpdate() {
            // 保存当前 canvas 状态
            ctx.save();

            // 清空画布
            ctx.clearRect(0, 0, width, height);
            // 进行放缩变化
            ctx.translate(transform.x, transform.y);
            ctx.scale(transform.k, transform.k);

            // 绘制点边
            renderEdges(graphInstance);
            renderNodes(graphInstance);

            // 恢复 canvas 状态
            ctx.restore();
        }

        /**
         * 绘制连边
         * @param graphInstance 图谱实例对象
         */
        function renderEdges(graphInstance) {
            graphInstance.edges.forEach(d => {
                ctx.beginPath();
                ctx.moveTo(d.source.x, d.source.y);
                ctx.lineTo(d.target.x, d.target.y);
                ctx.strokeStyle = '#999999';
                ctx.lineWidth = 0.75;
                ctx.stroke();
            });
        }

        /**
         * 绘制节点
         * @param graphInstance 图谱实例对象
         */
        function renderNodes(graphInstance) {
            graphInstance.nodes.forEach(d => {
                ctx.beginPath();
                ctx.moveTo(d.x + radius, d.y);
                ctx.arc(d.x, d.y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = '#999999';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            });
        }

        /**
         * 绑定事件
         * @param graphInstance 图谱实例对象
         */
        function bindEvent(graphInstance) {
            d3.select(ctx.canvas)
                // 拖拽
                .call(d3.drag()
                    // 一定需要绑定container，否则会导致找不到节点问题？
                    .container(ctx.canvas)
                    .subject(dragSubject)
                    .on('start', (event) => {
                        if (!event.active) graphInstance.simulation.alphaTarget(0.3).restart();
                        event.subject.fx = transform.invertX(event.x);
                        event.subject.fy = transform.invertY(event.y);
                    })
                    .on('drag', (event) => {
                        event.subject.fx = transform.invertX(event.x);
                        event.subject.fy = transform.invertY(event.y);
                    })
                    .on('end', (event) => {
                        if (!event.active) graphInstance.simulation.alphaTarget(0);
                        event.subject.fx = null;
                        event.subject.fy = null;
                    }))
                // 放缩
                .call(zoomObjectCanvas)
                // 阻止默认的双击放缩事件
                .on('dblclick.zoom', null);

            /**
             * 获取拖拽的节点对象，如果未能获取拖拽的节点，则进行画布拖拽
             * @param event 交互事件
             * @returns {*}
             */
            function dragSubject(event) {
                const x = transform.invertX(event.x),
                    y = transform.invertY(event.y);
                const node = findNode(graphInstance, x, y, radius);
                if (node) {
                    node.x = transform.applyX(node.x);
                    node.y = transform.applyY(node.y);
                }
                return node;
            }

            /**
             * 在 canvas 画布中寻找操作的节点
             * @param graphInstance 图谱实例对象
             * @param eventX 交互操作的 X 坐标
             * @param eventY 交互操作的 Y 坐标
             * @returns {null|*}
             */
            function findNode(graphInstance, eventX, eventY) {
                const radiusSquare = radius * radius;
                for (let i = graphInstance.nodes.length - 1; i >= 0; --i) {
                    const node = graphInstance.nodes[i],
                        dx = eventX - node.x,
                        dy = eventY - node.y,
                        distanceSquare = (dx * dx) + (dy * dy);
                    if (distanceSquare < radiusSquare) {
                        return node;
                    }
                }
                return undefined;
            }
        }
    })
};

// 初始化 SVG 画布元素
let renderParams = {
    radius: 4.5,
    width: 680,
    height: 580,
    margin: {top: 60, left: 60} // 视图内边距（主要用于自动放缩场景）
};
let {renderSVG, ctx} = initRenderSettings(renderParams);

// 渲染图谱
renderGraphBasedOnSVG(renderSVG, renderParams);
renderGraphBasedOnCanvas(ctx, renderParams);