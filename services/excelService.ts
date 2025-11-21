
// Excel service removed to revert to original local storage only version.
export const excelService = {
  exportData: () => { console.log("Excel export disabled"); },
  importData: async () => { return { success: false, message: "Excel import disabled" }; }
};
