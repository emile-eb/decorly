export async function initPurchases() {
  return;
}

export async function getCustomerInfo(): Promise<any> {
  return { entitlements: { active: {} } } as any;
}

export async function isPro(): Promise<boolean> {
  return false;
}

export async function getOfferings(): Promise<any> {
  return { current: null, all: {} } as any;
}

export async function purchasePackage(_pkg: any): Promise<any> {
  throw new Error('Purchases unavailable on web');
}

export async function restorePurchases(): Promise<any> {
  return null;
}
