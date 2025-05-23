/** @import { ExprNode } from '../ast/node.js' */
import { isNode } from '../ast/node.js';
import { recurse } from './recurse.js';

/**
 * Rewrite a SQL expression, based on a map of nodes to replace.
 * This method copies nodes as needed; it does not modify the input node.
 * @param {ExprNode} node The root AST node of the expression.
 * @param {Map<ExprNode, ExprNode>} map The rewrite map.
 *  When encountered, key nodes are replaced by value nodes.
 * @returns {ExprNode}
 */
export function rewrite(node, map) {
  if (map.has(node)) {
    return map.get(node);
  } else if (isNode(node)) {
    const props = recurse[node.type];
    const n = props?.length ?? 0;
    if (n > 0) {
      node = cloneNode(node);
      for (let i = 0; i < n; ++i) {
        const prop = props[i];
        const child = node[prop];
        if (Array.isArray(child)) {
          const m = child.length;
          for (let j = 0; j < m; ++j) {
            child[j] = rewrite(child[j], map);
          }
        } else if (child) {
          node[prop] = rewrite(child, map);
        }
      }
    }
  }
  return node;
}

// TODO: consider typed node.clone() methods
function cloneNode(node) {
  const clone = new node.constructor();
  for (const key in node) {
    clone[key] = node[key];
  }
  return clone;
}
