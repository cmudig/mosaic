import { literalToSQL } from './to-sql.js';
import {isParamLike, isSQLExpression} from './expression.js'

// abstract visitor class
class SQLVisitor {
    visitLiteral(literal) {}
    visitExpression(expression) {}
}

export class NonPreparedVisitor extends SQLVisitor {
    visitLiteral(literal) {
        return literalToSQL(literal.value)
    }

// Recursively process the SQL expression, converting it to a SQL string
    visitExpression(expression) {
        return expression._expr
          .map(p => {
            if (isSQLExpression(p)) {
              return this.visitExpression(p); // Handle nested expressions
            } else if (isParamLike(p)) {
              return this.visitLiteral(p); // Convert literals directly
            } else {
              return p.toString(); // Strings or non-parameter parts
            }
          })
          .join('');
    }

    getParams() {
        return []; // no params for non-prepared visitor
    }
}

export class PreparedVisitor extends SQLVisitor {
    constructor() {
        super();
        this.params = []; // stores the parameters while visiting sql expressions
    }

    visitLiteral(literal) {
        this.params.push(literal.value);
        return "?";
    }

    visitExpression(expression) {
        return expression._expr
          .map(p => {
            if (isSQLExpression(p)) {
              return this.visitExpression(p); // Handle nested expressions
            } else if (isParamLike(p)) {
              return this.visitLiteral(p); // Convert literals directly
            } else {
              return p.toString(); // Strings or non-parameter parts
            }
          })
          .join('');
    }

    getParams() {
        return this.params.slice(); // returns a safety copy of params for current visitor
    }
}