#!/usr/bin/env node
// Operator facts and screenshots of casaslegales.com: node tools/verify-operators.mjs [-q] [--today YYYY-MM-DD]
// (rules in tools/lib/opsources.mjs). Fresh copies and screenshots: node tools/capture-shots.mjs, then update the quotes.
import { checkOperators, loadOperators } from './lib/opsources.mjs';

const args = process.argv.slice(2);
const ti = args.indexOf('--today');
const today = ti >= 0 ? args[ti + 1] : new Date().toISOString().slice(0, 10);
const errs = checkOperators({ today });
errs.forEach(e => console.log('  BAD ' + e));
const d = loadOperators();
if (!args.includes('-q') || errs.length) console.log('verify-operators: ' + (errs.length ? 'CHECKS FAILED: ' + errs.length : 'ok, ' + Object.keys(d.quotes).length + ' quotes in ' + Object.keys(d.docs).length + ' saved copies'));
process.exit(errs.length ? 1 : 0);
