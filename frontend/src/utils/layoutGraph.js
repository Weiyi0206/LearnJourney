import dagre from 'dagre';

/**
 * Uses the Dagre library to compute a clean hierarchical layout
 * for React Flow nodes and edges.
 *
 * @param {Array} nodes  – React Flow nodes array
 * @param {Array} edges  – React Flow edges array
 * @param {string} direction – 'LR' (left→right) or 'TB' (top→bottom)
 * @returns {{ nodes: Array, edges: Array }}
 */
export function getLayoutedElements(nodes, edges, direction = 'LR') {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';

    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: 280,   // horizontal space between layers
        nodesep: 150,   // vertical space between sibling nodes
        edgesep: 80,    // space between edges
        marginx: 40,
        marginy: 40,
    });

    // Default node dimensions – should roughly match your CustomNode sizes
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 60;

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                // dagre gives center coords → shift to top-left for React Flow
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}
