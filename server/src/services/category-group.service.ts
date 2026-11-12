import {
  CategoryGroupRow,
  listCategoryGroups,
} from "../repositories/category-group.repository";

export function getCategoryGroups(): Promise<CategoryGroupRow[]> {
  return listCategoryGroups();
}
