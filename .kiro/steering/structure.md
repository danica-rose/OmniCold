# Repository Structure — OmniCold

## Directory Layout

```
omnicold/
├── .kiro/
│   ├── steering/
│   │   ├── product.md          # Product context and vision
│   │   ├── tech.md             # Technical stack and decisions
│   │   └── structure.md        # This file — repo architecture
│   └── specs/
│       └── omnicold-escrow/
│           ├── .config.kiro    # Spec configuration
│           ├── requirements.md # EARS-notation requirements
│           ├── design.md       # Technical design document
│           └── tasks.md        # Implementation tasks
├── contracts/
│   └── omnicold/
│       ├── Cargo.toml          # Rust/Soroban dependencies
│       └── src/
│           ├── lib.rs          # Contract implementation
│           └── test.rs         # 5 required test scenarios
├── scripts/
│   └── deploy.sh              # Deployment script for Stellar
└── README.md                   # Project overview
```

## Boundaries

- **contracts/omnicold/src/lib.rs**: All contract logic — initialization, bond deposit, breach reporting, slashing, delivery confirmation
- **contracts/omnicold/src/test.rs**: All test scenarios — no test logic in lib.rs
- **scripts/**: Deployment and operational scripts only — no business logic
- **.kiro/specs/**: Specification artifacts — requirements, design, tasks
- **.kiro/steering/**: Persistent project context for AI-assisted development

## Naming Conventions

- Contract functions: snake_case (e.g., `deposit_bond`, `report_breach`)
- Storage keys: PascalCase enum variants (e.g., `ShipmentState`, `BondAmount`)
- Types/structs: PascalCase (e.g., `ShipmentStatus`, `ContractConfig`)
- Test functions: `test_` prefix (e.g., `test_happy_path`, `test_unauthorized_reporter`)
