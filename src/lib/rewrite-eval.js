import esprima from 'esprima';
import escodegen from 'escodegen';

// Generate AST from statement list and playerId
function makeAST(statements, playerId) {
  return {
    type: 'Program',
    body: [{
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: {
            type: 'FunctionExpression',
            id: null,
            params: [{
              type: 'Identifier',
              name: 'here',
            }],
            defaults: [],
            body: {
              type: 'BlockStatement',
              body: statements,
            },
            rest: null,
            generator: false,
            expression: false,
          },
          property: {
            type: 'Identifier',
            name: 'call',
          },
        },
        arguments: [
          {
            type: 'Identifier',
            name: playerId,
          },
          {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: playerId,
            },
            property: {
              type: 'Identifier',
              name: 'location',
            },
          },
        ],
      },
    }],
  };
}

// Given a list of statements, if the last statement is an ExpressionStatement,
// turn it into a ReturnStatement.
function addReturn(statements) {
  const statement = statements[statements.length - 1];
  if (statement && statement.type === 'ExpressionStatement') {
    statement.type = 'ReturnStatement';
    statement.argument = statement.expression;
    delete statement.expression;
  }
  return statements;
}

// Given a piece of input JS, wrap it in an immediately executing function that
// returns the last expression statement found.
export default function rewriteEval(input, playerId) {
  const inputStatements = esprima.parse(input).body;
  const statementsWithReturn = addReturn(inputStatements);
  const newAST = makeAST(statementsWithReturn, playerId);
  const newCode = escodegen.generate(newAST);

  return newCode;
}
