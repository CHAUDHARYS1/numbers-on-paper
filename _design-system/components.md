# Components — Numbers on Paper

All components use tokens from `tokens.md` only. No hardcoded values.

## Button

```jsx
// Variants: primary | secondary | ghost | danger
// Sizes: sm | md | lg

<Button variant="primary" size="md">Save Invoice</Button>
<Button variant="secondary" size="md">Cancel</Button>
<Button variant="ghost" size="sm">Edit</Button>
<Button variant="danger" size="md">Delete</Button>

// With icon (Lucide):
<Button variant="primary" size="md" icon={<Plus size={16} />}>New Invoice</Button>

// Loading state:
<Button variant="primary" loading>Saving...</Button>
```

### Rules
- Primary: brand-600 bg, white text, hover brand-700
- Secondary: white bg, border-default, text-primary, hover bg-subtle
- Ghost: transparent bg, no border, text-secondary, hover bg-subtle
- Danger: danger-bg, danger-text, hover danger-border
- Border-radius: radius-md
- Font: text-sm, weight 500
- Height: sm=32px, md=36px, lg=40px
- Padding: sm=px-3, md=px-4, lg=px-5
- Disabled: opacity-50, cursor-not-allowed
- Loading: spinner replaces icon, text stays

## Input

```jsx
<Input
  label="Client Name"
  placeholder="DePaul University"
  error="This field is required"
  hint="Enter the organization or person's full name"
/>
```

### Rules
- Height: 36px
- Border: 1px border-default, radius-md
- Focus: border-brand, ring 3px brand-100
- Error: border-danger-border, ring danger-bg
- Label: text-sm, weight 500, text-primary, mb-space-1
- Hint: text-xs, text-muted, mt-space-1
- Error message: text-xs, text-danger, mt-space-1

## Textarea

Same rules as Input, min-height 80px, resize-y.

## Select

```jsx
<Select label="Status" options={[...]} value={v} onChange={fn} />
```

Same sizing as Input. Custom styled — no native browser select appearance.

## Badge / Status Pill

```jsx
<Badge variant="paid" />     // green
<Badge variant="unpaid" />   // red
<Badge variant="draft" />    // neutral
<Badge variant="overdue" />  // amber
```

### Rules
- Font: text-xs, weight 500
- Padding: px-2.5 py-0.5
- Border-radius: radius-pill
- No border, uses semantic bg/text tokens

## Card

```jsx
<Card>
  <CardHeader title="Invoice Detail" action={<Button>Add Item</Button>} />
  <CardBody>...</CardBody>
</Card>
```

### Rules
- bg-surface, border border-default, radius-lg, shadow-sm
- CardHeader: px-6 pt-5 pb-4, border-bottom border-default
- CardBody: p-6
- Title: text-md weight 600 text-primary

## Table

```jsx
<Table>
  <TableHead>
    <Th>Item</Th><Th>Hours</Th><Th align="right">Cost</Th>
  </TableHead>
  <TableBody>
    <Tr>
      <Td>Redesign</Td><Td>4</Td><Td align="right">$200.00</Td>
    </Tr>
  </TableBody>
</Table>
```

### Rules
- Full width, border-collapse
- Th: text-xs uppercase tracking-wide weight 500 text-muted, border-bottom border-default, py-3 px-4
- Td: text-sm text-primary, py-3 px-4, border-bottom border-default (except last row)
- Odd row hover: bg-subtle
- Numbers/amounts: font-mono

## Modal

```jsx
<Modal open={open} onClose={fn} title="Delete Invoice" size="md">
  <ModalBody>...</ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={fn}>Cancel</Button>
    <Button variant="danger" onClick={fn}>Delete</Button>
  </ModalFooter>
</Modal>
```

### Rules
- Overlay: bg-overlay, z-modal
- Panel: bg-surface, radius-xl, shadow-xl, max-w: sm=400px, md=560px, lg=720px
- Header: px-6 py-5, border-bottom, title text-lg weight 600
- Body: p-6
- Footer: px-6 py-4, border-top, flex justify-end gap-3

## Toast / Notification

```jsx
toast.success('Invoice saved successfully')
toast.error('Failed to save invoice')
```

### Rules
- Position: fixed bottom-right, z-toast
- radius-lg, shadow-lg, px-4 py-3
- Success: success-bg/text/border
- Error: danger-bg/text/border
- Auto-dismiss: 4000ms
- Max stack: 3

## Sidebar Nav Item

```jsx
<NavItem icon={<FileText size={18} />} label="Invoices" active={true} />
```

### Rules
- Height: 40px, px-3, radius-md
- Active: brand-50 bg, brand-600 text, brand-600 icon
- Inactive: transparent bg, text-secondary, hover bg-subtle
- Icon: 18px, mr-space-3
- Font: text-sm weight 500
- Transition: transition-fast

## Empty State

```jsx
<EmptyState
  icon={<FileText size={40} />}
  title="No invoices yet"
  description="Create your first invoice to get started."
  action={<Button variant="primary">Create Invoice</Button>}
/>
```

### Rules
- Centered, py-16
- Icon: text-muted, mb-space-4
- Title: text-lg weight 600, mb-space-2
- Description: text-sm text-secondary, mb-space-6

## Page Header

```jsx
<PageHeader
  title="Invoices"
  description="Manage and track all your invoices"
  action={<Button variant="primary" icon={<Plus size={16} />}>New Invoice</Button>}
/>
```

### Rules
- mb-space-8
- Title: text-2xl weight 600
- Description: text-sm text-secondary, mt-space-1
- Action: floated right, aligned center vertically

## Line Item Row (Invoice-specific)

```jsx
<LineItemRow
  item={item}
  onChange={fn}
  onDelete={fn}
  rateMode="hourly" // or "fixed"
/>
```

Fields: item name, description, date (optional), hours or qty, rate, total (auto-calculated, read-only).
Delete icon on right. Drag handle on left for reorder.

## Totals Block (Invoice-specific)

Shows: Subtotal, Discount (optional, toggleable), Tax (optional, toggleable), Grand Total.
Aligned right, monospace amounts, border-top before Grand Total.
