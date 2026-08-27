# Budget Tracker

Single-user personal budget tracker: log income and expenses, see totals at a glance, filter history, and import bank CSV exports.

## Language

**Transaction**:
A single income or expense on a calendar date — the only record the tracker stores.
_Avoid_: entry, record, line item

**Money**:
An amount of US dollars held as a positive count of integer cents; dollar strings exist only at the edges (form input, CSV cells, display).
_Avoid_: float dollars, amount-in-dollars

**Type**:
Whether a transaction is income or expense; direction never comes from an amount's sign inside the app.
_Avoid_: direction, credit/debit (bank-export spellings, normalized away at import)

**Category**:
A free-form label on a transaction. The eight presets are suggestions, not constraints.
_Avoid_: tag, group

**Summary**:
Total income, total expenses, and net balance for the transactions currently in view — it follows the active filters.
_Avoid_: totals, balance

**Import Preview**:
The reviewable result of parsing a bank export: every row judged valid, invalid, or duplicate, plus which rows are currently chosen. Nothing is stored until the preview is committed.
_Avoid_: staging, draft

**Duplicate**:
An import row matching an existing transaction — or an earlier row in the same batch — on date, money, and description. A suspected re-import: excluded by default, importable on purpose.
_Avoid_: conflict
