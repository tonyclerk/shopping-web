export const SELLER_CATEGORIES = [
  { name: "Accessories", description: "Belts, bags, sunglasses, wallets" },
  { name: "Clothing", description: "Men, women, and kids clothing" },
  { name: "Shoes", description: "Casual, sports, and formal footwear" },
  { name: "Watches", description: "Analog, digital, and smart watches" },
];

export function isBusinessInfoComplete(seller = {}) {
  if (seller?.onboarding?.businessInfoCompleted) return true;

  return Boolean(
    String(seller?.businessName ?? "").trim() &&
    String(seller?.email ?? "").trim() &&
    String(seller?.address ?? "").trim()
  );
}

export function hasCompletedCategories(seller = {}) {
  if (seller?.onboarding?.categoriesCompleted) return true;
  return Array.isArray(seller?.categories) && seller.categories.length > 0;
}

export function getSellerNextRoute(seller = {}) {
  if (!isBusinessInfoComplete(seller)) return "/onboarding";
  if (!hasCompletedCategories(seller)) return "/categories";
  return "/dashboard";
}

export function isSellerApprovedAndVerified(seller = {}) {
  const approvalStatus = String(seller?.status ?? "").trim().toLowerCase();
  const kycStatus = String(seller?.kycStatus ?? seller?.kyc?.status ?? "").trim().toLowerCase();

  const isApproved = approvalStatus === "approved";
  const isVerified = kycStatus === "verified";

  return isApproved && isVerified;
}

export function buildProfileState(seller = {}, authUser) {
  const createdOn = authUser?.metadata?.creationTime
    ? new Date(authUser.metadata.creationTime).toLocaleDateString()
    : "-";

  return {
    vendorName: seller?.name ?? authUser?.displayName ?? authUser?.email ?? "-",
    approvalStatus: seller?.status ?? "pending",
    vendorId: authUser?.uid ?? "-",
    business: {
      brandName: seller?.businessName ?? "-",
      email: seller?.email ?? authUser?.email ?? "-",
      phone: seller?.phone ?? "-",
      address: seller?.address ?? "-",
      createdOn,
    },
    bank: {
      accountHolderName: seller?.bank?.accountHolderName ?? "-",
      accountNumber: seller?.bank?.accountNumber ?? "-",
      ifscCode: seller?.bank?.ifscCode ?? "-",
      bankName: seller?.bank?.bankName ?? "-",
    },
    categories: Array.isArray(seller?.categories) ? seller.categories : [],
  };
}
