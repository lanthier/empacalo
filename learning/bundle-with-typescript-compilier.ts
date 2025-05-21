/**
 * This file is only for learning purposes and the actual bundling that this project does
 * uses esbuild.
 * Using the TypeScript compiler, we traverse an AST to create a DAG of the imports and
 * their dependencies. From there, we run a topological sort and flatten it into a single
 * file.
 */

import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

// Stores a file path and it's associated imports to be used in a DAG
interface ModuleNode {
  filePath: string;
  imports: string[];
  source: string;
}

const projectRoot = path.resolve(__dirname, "src");

// Bundles into a single TS file
function readModule(filePath: string): ModuleNode {
  const source = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.ESNext,
    true
  );

  const imports: string[] = [];

  // Run through each statement in the source file, check for import statements and build a DAG entry
  sourceFile.forEachChild((node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      let importPath = node.moduleSpecifier.text;
      if (!importPath.endsWith(".ts")) importPath += ".ts";
      const absPath = path.resolve(path.dirname(filePath), importPath);
      imports.push(absPath);
    }
  });

  return { filePath, imports, source };
}

// Recursively build dependency graph
function buildDependencyGraph(
  entry: string,
  visited = new Map<string, ModuleNode>()
) {
  const absEntry = path.resolve(entry);
  if (visited.has(absEntry)) return;

  const mod = readModule(absEntry);
  visited.set(absEntry, mod);
  for (const dep of mod.imports) {
    buildDependencyGraph(dep, visited);
  }
}

// Topological sort using Kahn’s algorithm
function topoSort(graph: Map<string, ModuleNode>): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const [file, mod] of graph.entries()) {
    inDegree.set(file, 0);
    adjacency.set(file, []);
  }

  for (const [file, mod] of graph.entries()) {
    for (const dep of mod.imports) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      adjacency.get(file)?.push(dep);
    }
  }

  const queue = [
    ...[...inDegree.entries()].filter(([_, deg]) => deg === 0).map(([f]) => f),
  ];
  const sorted: string[] = [];

  while (queue.length) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency.get(current) || []) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== graph.size) {
    throw new Error("Cycle detected in dependency graph!");
  }

  return sorted;
}

// Outputs concatenated sources in dependency order (builds the bundle)
function bundle(entry: string, outFile: string) {
  const graph = new Map<string, ModuleNode>();
  buildDependencyGraph(entry, graph);
  const sortedFiles = topoSort(graph);

  const output = sortedFiles
    .map((f) => `// ${path.basename(f)}\n${graph.get(f)!.source}`)
    .join("\n\n");

  fs.writeFileSync(outFile, output);
  console.log(`Bundled to ${outFile}`);
}

// Run
bundle(path.join(projectRoot, "entry.ts"), "bundle.js");
