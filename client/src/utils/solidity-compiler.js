/**
 * solidity-compiler.js — In-browser Solidity compilation via server API
 * Compilation happens on the server where solc is installed.
 */

const API_BASE = '/api';

function parseCompilerOutput(output) {
  const errors = [];
  const warnings = [];
  const contracts = {};

  if (output.errors) {
    output.errors.forEach(err => {
      if (err.severity === 'error') {
        errors.push({ severity: err.severity, message: err.message, formattedMessage: err.formattedMessage });
      } else {
        warnings.push({ severity: err.severity, message: err.message, formattedMessage: err.formattedMessage });
      }
    });
  }

  if (output.contracts) {
    // Check if the backend already flattened the contracts (no file keys)
    const isFlattened = Object.values(output.contracts).some(v => v.abi !== undefined);

    if (isFlattened) {
      Object.keys(output.contracts).forEach(contractName => {
        const c = output.contracts[contractName];
        contracts[contractName] = {
          abi: c.abi || [],
          bytecode: c.bytecode || '',
          gasEstimates: c.gasEstimates || {},
        };
      });
    } else {
      // Handle raw solc output with file keys
      Object.keys(output.contracts).forEach(file => {
        Object.keys(output.contracts[file]).forEach(contractName => {
          const c = output.contracts[file][contractName];
          contracts[contractName] = {
            abi: c.abi || [],
            bytecode: c.evm?.bytecode?.object || '',
            gasEstimates: c.evm?.gasEstimates || {},
          };
        });
      });
    }
  }

  return { success: errors.length === 0, errors, warnings, contracts, ast: output.ast };
}

export function extractContractTree(ast) {
  if (!ast || !ast.nodes) return [];
  const trees = [];

  function walkNodes(nodes) {
    nodes.forEach(node => {
      if (node.nodeType === 'ContractDefinition') {
        const tree = { name: node.name, kind: node.contractKind, stateVars: [], functions: [], events: [], modifiers: [], structs: [], enums: [] };
        (node.nodes || []).forEach(member => {
          switch (member.nodeType) {
            case 'VariableDeclaration':
              tree.stateVars.push({ name: member.name, type: member.typeName?.name || 'unknown', visibility: member.visibility });
              break;
            case 'FunctionDefinition':
              tree.functions.push({
                name: member.name || (member.kind === 'constructor' ? 'constructor' : member.kind),
                kind: member.kind, visibility: member.visibility, stateMutability: member.stateMutability,
                params: (member.parameters?.parameters || []).map(p => ({ name: p.name, type: p.typeName?.name || 'unknown' })),
              });
              break;
            case 'EventDefinition':
              tree.events.push({ name: member.name, params: (member.parameters?.parameters || []).map(p => ({ name: p.name, type: p.typeName?.name, indexed: p.indexed })) });
              break;
            case 'StructDefinition':
              tree.structs.push({ name: member.name, members: (member.members || []).map(m => ({ name: m.name, type: m.typeName?.name })) });
              break;
          }
        });
        trees.push(tree);
      }
    });
  }
  walkNodes(ast.nodes);
  return trees;
}

export async function compileSolidity(source) {
  try {
    const res = await fetch(`${API_BASE}/blockchain/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    });
    const data = await res.json();
    console.log('Raw compile response:', data);
    if (!res.ok) throw new Error(data.error || 'Compile failed');
    return parseCompilerOutput(data);
  } catch (err) {
    return { success: false, errors: [{ severity: 'error', message: err.message, formattedMessage: err.message }], warnings: [], contracts: {}, ast: null };
  }
}
