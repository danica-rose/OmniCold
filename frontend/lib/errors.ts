export interface ContractErrorInfo {
  message: string;
  severity: 'error' | 'warning';
}

export const CONTRACT_ERROR_MAP: Record<number, ContractErrorInfo> = {
  1: { message: 'A shipment has already been created for this contract.', severity: 'error' },
  2: { message: 'Minimum temperature must be less than maximum temperature.', severity: 'error' },
  3: { message: 'Bond amount must be greater than zero.', severity: 'error' },
  4: { message: 'All participant addresses must be unique.', severity: 'error' },
  5: { message: 'Only the designated Logistics Provider can perform this action.', severity: 'error' },
  6: { message: 'Only the authorized Oracle can report temperatures.', severity: 'error' },
  7: { message: 'Only the Shipper can confirm delivery.', severity: 'error' },
  8: { message: 'This action is not available in the current shipment state.', severity: 'error' },
  9: { message: 'USDC transfer failed — check balance and allowance.', severity: 'error' },
};

export function mapContractError(code: number): string {
  const info = CONTRACT_ERROR_MAP[code];
  if (info) {
    return info.message;
  }
  return 'An unknown contract error occurred.';
}
