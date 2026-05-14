#!/usr/bin/env node

/**
 * Storezen Doctor - Diagnostic & Auto-fix Script
 * Run: node scripts/doctor.mjs
 * Or: pnpm doctor
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// ============================================================================
// COLOR HELPERS
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function red(msg) { return `${colors.red}${msg}${colors.reset}`; }
function green(msg) { return `${colors.green}${msg}${colors.reset}`; }
function yellow(msg) { return `${colors.yellow}${msg}${colors.reset}`; }
function blue(msg) { return `${colors.blue}${msg}${colors.reset}`; }
function cyan(msg) { return `${colors.cyan}${msg}${colors.reset}`; }
function bold(msg) { return `${colors.bold}${msg}${colors.reset}`; }
function dim(msg) { return `${colors.dim}${msg}${colors.reset}`; }

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(msg) { console.log(msg); }
function logHeader(msg) { log(`\n${bold(colors.blue('═'.repeat(60)))}\n  ${msg}\n${bold(colors.blue('═'.repeat(60)))}`); }
function logSection(msg) { log(`\n${bold(cyan(msg))}`); }

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: options.cwd || rootDir,
      ...options
    }).trim();
  } catch (error) {
    return null;
  }
}

function getPackageJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readLine(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

async function checkNodeVersion() {
  logSection('Checking Node.js Version');

  const version = exec('node --version');
  if (!version) {
    log(`${red('✗')} Node.js not found`);
    return { pass: false, fix: 'Install Node.js >= 20.0.0 from nodejs.org or use nvm' };
  }

  const major = parseInt(version.replace('v', '').split('.')[0]);

  if (major >= 20) {
    log(`${green('✓')} Node.js ${version} (>= 20.0.0)`);
    return { pass: true, value: version };
  } else {
    log(`${red('✗')} Node.js ${version} (requires >= 20.0.0)`);
    return {
      pass: false,
      fix: 'Run: nvm install 20 && nvm use 20',
      command: 'nvm install 20'
    };
  }
}

async function checkPnpmVersion() {
  logSection('Checking pnpm Version');

  let version = exec('pnpm --version');

  if (!version) {
    log(`${red('✗')} pnpm not found`);
    return {
      pass: false,
      fix: 'Auto-install pnpm?',
      command: 'npm install -g pnpm@latest'
    };
  }

  const major = parseInt(version.split('.')[0]);

  if (major >= 9) {
    log(`${green('✓')} pnpm ${version} (>= 9.0.0)`);
    return { pass: true, value: version };
  } else {
    log(`${red('✗')} pnpm ${version} (requires >= 9.0.0)`);
    return {
      pass: false,
      fix: 'Auto-upgrade pnpm?',
      command: 'npm install -g pnpm@latest'
    };
  }
}

async function checkNodeModules() {
  logSection('Checking node_modules Directories');

  const dirs = [
    { path: join(rootDir, 'node_modules'), name: 'root' },
    { path: join(rootDir, 'apps', 'api', 'node_modules'), name: 'api' },
    { path: join(rootDir, 'apps', 'web', 'node_modules'), name: 'web' },
  ];

  // Add packages
  const packagesDir = join(rootDir, 'packages');
  if (existsSync(packagesDir)) {
    const packages = readdirSync(packagesDir).filter(p => {
      return statSync(join(packagesDir, p)).isDirectory();
    });
    packages.forEach(pkg => {
      dirs.push({
        path: join(packagesDir, pkg, 'node_modules'),
        name: `packages/${pkg}`
      });
    });

    // Check packages/lib subdirectories
    const libDir = join(packagesDir, 'lib');
    if (existsSync(libDir)) {
      const libs = readdirSync(libDir).filter(p => {
        return statSync(join(libDir, p)).isDirectory();
      });
      libs.forEach(lib => {
        dirs.push({
          path: join(libDir, lib, 'node_modules'),
          name: `packages/lib/${lib}`
        });
      });
    }
  }

  let allExist = true;
  for (const dir of dirs) {
    const exists = existsSync(dir.path);
    if (exists) {
      log(`${green('✓')} ${dir.name}/node_modules exists`);
    } else {
      log(`${red('✗')} ${dir.name}/node_modules missing`);
      allExist = false;
    }
  }

  return { pass: allExist, dirs };
}

async function checkPnpmLockfile() {
  logSection('Checking pnpm-lock.yaml');

  const lockPath = join(rootDir, 'pnpm-lock.yaml');
  const exists = existsSync(lockPath);

  if (exists) {
    log(`${green('✓')} pnpm-lock.yaml exists`);
    return { pass: true, exists: true };
  } else {
    log(`${red('✗')} pnpm-lock.yaml missing`);
    return { pass: false, exists: false };
  }
}

async function checkNpmrc() {
  logSection('Checking .npmrc Configuration');

  const npmrcPath = join(rootDir, '.npmrc');
  const exists = existsSync(npmrcPath);

  if (exists) {
    const content = readFileSync(npmrcPath, 'utf8');
    log(`${green('✓')} .npmrc exists`);

    // Check for key settings
    const hasRegistry = content.includes('registry=');
    const hasPeerDeps = content.includes('strict-peer-dependencies');
    const hasPeers = content.includes('auto-install-peers');

    if (!hasRegistry) log(`${yellow('!')} Missing registry config`);
    if (!hasPeerDeps) log(`${yellow('!'} Missing strict-peer-dependencies`);
    if (!hasPeers) log(`${yellow('!')} Missing auto-install-peers`);

    return { pass: true, exists: true, content };
  } else {
    log(`${red('✗')} .npmrc missing`);
    return { pass: false, exists: false };
  }
}

async function checkPackageJsonType() {
  logSection('Checking package.json "type" field');

  const pkgPath = join(rootDir, 'package.json');
  const pkg = getPackageJson(pkgPath);

  if (!pkg) {
    log(`${red('✗')} Root package.json not found`);
    return { pass: false };
  }

  if (pkg.type === 'module') {
    log(`${green('✓')} "type": "module" present`);
    return { pass: true };
  } else {
    log(`${red('✗')} Missing "type": "module"`);
    return { pass: false, fix: 'Add "type": "module" to package.json' };
  }
}

async function checkWorkspacePackages() {
  logSection('Validating Workspace Packages');

  const packages = [];

  // Check apps
  const appsDir = join(rootDir, 'apps');
  if (existsSync(appsDir)) {
    const apps = readdirSync(appsDir).filter(a => {
      return statSync(join(appsDir, a)).isDirectory();
    });
    apps.forEach(app => {
      packages.push({ name: `apps/${app}`, path: join(appsDir, app) });
    });
  }

  // Check packages
  const packagesDir = join(rootDir, 'packages');
  if (existsSync(packagesDir)) {
    const pkgs = readdirSync(packagesDir).filter(p => {
      return statSync(join(packagesDir, p)).isDirectory();
    });
    pkgs.forEach(pkg => {
      packages.push({ name: `packages/${pkg}`, path: join(packagesDir, pkg) });
    });

    // Check packages/lib subdirs
    const libDir = join(packagesDir, 'lib');
    if (existsSync(libDir)) {
      const libs = readdirSync(libDir).filter(l => {
        return statSync(join(libDir, l)).isDirectory();
      });
      libs.forEach(lib => {
        packages.push({ name: `packages/lib/${lib}`, path: join(libDir, lib) });
      });
    }
  }

  let allValid = true;
  const issues = [];

  for (const pkg of packages) {
    const pkgJsonPath = join(pkg.path, 'package.json');
    const pkgJson = getPackageJson(pkgJsonPath);

    if (!pkgJson) {
      log(`${red('✗')} ${pkg.name}: package.json missing`);
      allValid = false;
      issues.push({ name: pkg.name, issue: 'package.json missing' });
      continue;
    }

    const required = ['name', 'version'];
    const optional = ['main', 'types', 'exports', 'scripts'];

    let hasIssue = false;
    for (const field of required) {
      if (!pkgJson[field]) {
        log(`${red('✗')} ${pkg.name}: missing "${field}"`);
        hasIssue = true;
      }
    }

    if (pkgJson.scripts && !pkgJson.scripts.build) {
      log(`${yellow('!')} ${pkg.name}: missing build script`);
    }

    if (!hasIssue) {
      log(`${green('✓')} ${pkg.name}: valid`);
    } else {
      allValid = false;
      issues.push({ name: pkg.name, issue: 'Missing required fields' });
    }
  }

  return { pass: allValid, issues };
}

// ============================================================================
// AUTO-FIX FUNCTIONS
// ============================================================================

async function fixPnpm() {
  log(yellow('Installing pnpm@latest globally...'));
  try {
    exec('npm install -g pnpm@latest');
    log(green('pnpm updated successfully!'));
    return true;
  } catch (error) {
    log(red(`Failed to install pnpm: ${error.message}`));
    return false;
  }
}

async function fixNpmrc() {
  const npmrcContent = `registry=https://registry.npmjs.org
strict-peer-dependencies=false
auto-install-peers=true
node-linker=hoisted
shamefully-hoist=true
`;

  const npmrcPath = join(rootDir, '.npmrc');
  writeFileSync(npmrcPath, npmrcContent);
  log(green('.npmrc created with optimal settings'));
}

async function fixPackageJsonType() {
  const pkgPath = join(rootDir, 'package.json');
  const pkg = getPackageJson(pkgPath);
  pkg.type = 'module';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  log(green('Added "type": "module" to package.json'));
}

async function cleanInstall() {
  log(yellow('Running clean install...'));
  log(dim('This may take a few minutes...\n'));

  try {
    // Remove all node_modules and lockfile
    const dirsToClean = [
      join(rootDir, 'node_modules'),
      join(rootDir, 'apps', 'api', 'node_modules'),
      join(rootDir, 'apps', 'web', 'node_modules'),
      join(rootDir, 'packages'),
      join(rootDir, 'pnpm-lock.yaml'),
    ];

    for (const dir of dirsToClean) {
      if (existsSync(dir)) {
        if (statSync(dir).isDirectory()) {
          rmSync(dir, { recursive: true, force: true });
          log(dim(`Removed ${dir}`));
        } else {
          rmSync(dir, { force: true });
          log(dim(`Removed ${dir}`));
        }
      }
    }

    // Run pnpm install
    exec('pnpm install', { stdio: 'inherit' });
    log(green('\n✓ Clean install completed!'));
    return true;
  } catch (error) {
    log(red(`\nClean install failed: ${error.message}`));
    return false;
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function runDoctor() {
  logHeader('Storezen Doctor - Environment Diagnostic');

  log(cyan('Initializing diagnostic checks...\n'));

  const results = {
    node: await checkNodeVersion(),
    pnpm: await checkPnpmVersion(),
    nodeModules: await checkNodeModules(),
    lockfile: await checkPnpmLockfile(),
    npmrc: await checkNpmrc(),
    packageType: await checkPackageJsonType(),
    workspaces: await checkWorkspacePackages(),
  };

  // =========================================================================
  // AUTO-FIX PROMPTS
  // =========================================================================

  logHeader('Running Auto-Fixes');

  let needsInstall = false;

  // Fix pnpm if needed
  if (!results.pnpm.pass && results.pnpm.command) {
    const answer = await readLine(yellow(`Fix pnpm (${results.pnpm.command})? (y/n): `));
    if (answer === 'y' || answer === 'yes') {
      await fixPnpm();
      results.pnpm = await checkPnpmVersion();
    }
  }

  // Fix .npmrc if needed
  if (!results.npmrc.pass) {
    const answer = await readLine(yellow('Create optimal .npmrc? (y/n): '));
    if (answer === 'y' || answer === 'yes') {
      await fixNpmrc();
      results.npmrc = await checkNpmrc();
    }
  }

  // Fix package.json type
  if (!results.packageType.pass) {
    const answer = await readLine(yellow('Add "type": "module" to package.json? (y/n): '));
    if (answer === 'y' || answer === 'yes') {
      await fixPackageJsonType();
      results.packageType = await checkPackageJsonType();
    }
  }

  // Clean install prompt
  const allPass = results.node.pass && results.pnpm.pass &&
                 results.packageType.pass && results.workspaces.pass;

  if (!allPass) {
    const answer = await readLine(yellow('\nRun full clean install? (y/n): '));
    if (answer === 'y' || answer === 'yes') {
      await cleanInstall();
      needsInstall = true;
    }
  }

  // =========================================================================
  // FINAL VERIFICATION
  // =========================================================================

  logHeader('Final Verification');

  if (!needsInstall) {
    results.nodeModules = await checkNodeModules();
    results.lockfile = await checkPnpmLockfile();
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================

  logHeader('Diagnostic Summary');

  const checks = [
    { name: 'Node.js', pass: results.node.pass, detail: results.node.value || 'not found' },
    { name: 'pnpm', pass: results.pnpm.pass, detail: results.pnpm.value || 'not found' },
    { name: 'node_modules', pass: results.nodeModules.pass, detail: 'all directories exist' },
    { name: 'pnpm-lock.yaml', pass: results.lockfile.pass, detail: results.lockfile.exists ? 'exists' : 'missing' },
    { name: '.npmrc', pass: results.npmrc.pass, detail: results.npmrc.exists ? 'configured' : 'missing' },
    { name: 'package.json type', pass: results.packageType.pass, detail: 'module' },
    { name: 'Workspace packages', pass: results.workspaces.pass, detail: `${results.workspaces.issues?.length || 0} issues` },
  ];

  let passCount = 0;
  for (const check of checks) {
    if (check.pass) {
      log(`${green('✓')} ${check.name}: ${check.detail}`);
      passCount++;
    } else {
      log(`${red('✗')} ${check.name}: ${check.detail}`);
    }
  }

  log(`\n${bold(cyan('Result:'))} ${passCount}/${checks.length} checks passed`);

  if (passCount === checks.length) {
    log(green('\n🎉 All checks passed! Your environment is healthy.\n'));
    process.exit(0);
  } else {
    log(yellow('\n⚠️  Some issues need attention. Review the output above.\n'));
    process.exit(1);
  }
}

// ============================================================================
// RUN
// ============================================================================

runDoctor().catch(error => {
  log(red(`\nDoctor crashed: ${error.message}`));
  process.exit(1);
});