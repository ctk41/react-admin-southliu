import type { SideMenu } from '#/public';
import { LANG } from '@/utils/config';

/**
 * 根据路由获取展开菜单数组
 * @param router - 路由
 */
export function getOpenMenuByRouter(router: string): string[] {
  const arr = splitPath(router), result: string[] = [];

  // 取第一个单词大写为新展开菜单key
  if (arr.length > 0) result.push(arr[0]);

  // 当路由处于多级目录时
  if (arr.length > 2) {
    let str = '/' + arr[0];
    for (let i = 1; i < arr.length - 1; i++) {
      str += '/' + arr[i];
      result.push(str);
    }
  }

  return result;
}

/**
 * 匹配路径内的字段
 * @param path - 路径
 * @param arr - 路径经过数组
 */
function matchPath(path: string, arr: MenuPath[]): string[] {
  const result: string[] = [];

  // 分割路径
  const pathArr = splitPath(path);
  let left = 0;
  const right = pathArr.length;

  for (let i = 0; i < arr.length; i++) {
    const { path } = arr[i];
    if (path?.[left] === pathArr[left]) {
      result.push(arr[i].label);
      if (left < right - 1) left++;
    }
    if (left === right) return result;
  }

  return result;
}

/**
 * 分割路径且去除首个字符串
 * @param path - 路径
 */
export function splitPath(path: string): string[] {
  // 路径为空或非字符串格式则返回空数组
  if (!path || typeof path !== 'string') return [];
  // 分割路径
  const result = path?.split('/') || [];
  // 去除第一个空字符串
  if (result?.[0] === '') result.shift();
  return result;
}

/**
 * 搜索相应菜单值
 * @param menus - 菜单
 * @param permissions - 权限列表
 * @param value - 匹配值
 * @param currentPath - 当前路径
 * @param result - 返回值
 */

interface MenuPath {
  label: string;
  path: string[];
}
interface SearchMenuProps {
  menus: SideMenu[] | undefined,
  permissions: string[],
  value: string,
  currentPath?: MenuPath[],
  result?: SideMenu[]
}

export function searchMenuValue(data: SearchMenuProps): SideMenu[] {
  const { menus, permissions, value } = data;
  let { currentPath, result } = data;
  if (!menus?.length || !value) return [];
  if (!currentPath) currentPath = [];
  if (!result) result = [];

  for (let i = 0; i < menus.length; i++) {
    // 如果存在子数组则递归
    if (hasChildren(menus[i])) {
      currentPath.push({
        label: menus[i].label,
        path: splitPath(menus[i].key)
      });

      // 递归子数组，返回结果
      const childrenData = {
        menus: menus[i].children,
        permissions,
        value,
        currentPath,
        result
      };
      const childResult = searchMenuValue(childrenData);

      // 当子数组返回值有值时则合并数组
      if (childResult.length) {
        result.concat(childResult);
      } else {
        currentPath.pop();
      }
    } else if (
      menus[i]?.label?.includes(value) &&
      hasPermission(menus[i], permissions)
    ) {
      currentPath.push({
        label: menus[i].label,
        path: splitPath(menus[i].key)
      });
      const nav = matchPath(menus[i].key, currentPath);

      // 匹配到value值时添加到result中
      const { label, labelEn, key } = menus[i];
      result.push({ label, labelEn, key, nav });
    }
  }

  return result;
}

/**
 * 根据key获取菜单当前值
 * @param menus - 菜单
 * @param permissions - 权限列表
 * @param key - 路由值
 * @param fatherNav - 父级面包屑
 * @param result - 返回值
 */
interface GetMenuByKeyResult {
  label: string;
  key: string;
  nav: string[];
}
interface GetMenuByKeyProps {
  menus: SideMenu[] | undefined,
  permissions: string[],
  key: string,
  fatherNav?: string[],
  result?: GetMenuByKeyResult
}

export function getMenuByKey(data: GetMenuByKeyProps): GetMenuByKeyResult | undefined {
  const { menus, permissions, key } = data;
  let { fatherNav, result } = data;
  const lang = localStorage.getItem(LANG);
  if (!menus?.length) return result;
  if (!fatherNav) fatherNav = [];
  if (!result?.key) result = {
    key: '',
    label: '',
    nav: []
  };

  for (let i = 0; i < menus.length; i++) {
    if (!key || (result as GetMenuByKeyResult).key) return result;

    // 过滤子数据中值
    if (hasChildren(menus[i])) {
      fatherNav.push(lang === 'en' ? menus[i].labelEn : menus[i].label);

      // 递归子数组，返回结果
      const childProps = {
        menus: menus[i].children,
        permissions,
        key,
        fatherNav,
        result
      };
      const childResult = getMenuByKey(childProps);

      // 当子数组返回值
      if (childResult?.key) {
        result = childResult;
      } else {
        // 下次递归前删除面包屑前一步错误路径
        fatherNav.pop();
      }
    } else if (
      menus[i]?.key === key &&
      hasPermission(menus[i], permissions)
    ) {
      const label = lang === 'en' ? menus[i].labelEn : menus[i].label;
      fatherNav.push(label);
      const { key } = menus[i];
      if (key) result = { label, key, nav: fatherNav };
    }
  }

  return result;
}

/**
 * 过滤权限菜单
 * @param menus - 菜单
 * @param permissions - 权限列表
 */
export function filterMenus(
  menus: SideMenu[],
  permissions: string[]
): SideMenu[] {
  const result: SideMenu[] = [];
  const newMenus = JSON.parse(JSON.stringify(menus));
  const lang = localStorage.getItem(LANG);

  for (let i = 0; i < newMenus.length; i++) {
    // 处理子数组
    if (hasChildren(newMenus[i])) {
      const result = filterMenus(
        newMenus[i].children as SideMenu[],
        permissions
      );

      // 有子权限数据则保留
      newMenus[i].children = result?.length ? result : undefined;
    }

    // 有权限或有子数据累加
    if (
      hasPermission(newMenus[i], permissions) ||
      hasChildren(newMenus[i])
    ) {
      if (lang === 'en') newMenus[i].label = newMenus[i].labelEn;
      result.push(newMenus[i]);
    }
  }

  return result;
}

/**
 * 获取第一个有效权限路由
 * @param menus - 菜单
 * @param permissions - 权限
 */
export function getFirstMenu(
 menus: SideMenu[],
 permissions: string[],
 result = ''
): string {
  // 有结构时直接返回
  if (result) return result;

  for (let i = 0; i < menus.length; i++) {
    // 处理子数组
    if (hasChildren(menus[i]) && !result) {
      const childResult = getFirstMenu(
        menus[i].children as SideMenu[],
        permissions,
        result
      );

      // 有结果则赋值
      if (childResult) {
        result = childResult;
        return result;
      }
    }

    // 有权限且没有有子数据
    if (
      hasPermission(menus[i], permissions) &&
      !hasChildren(menus[i])
    ) result = menus[i].key;
  }

  return result;
}

/**
 * 路由是否权限
 * @param route - 路由
 * @param permissions - 权限
 */
function hasPermission(route: SideMenu, permissions: string[]): boolean {
  return permissions?.includes(route?.rule || '');
}

/**
 * 是否有子路由
 * @param route - 路由
 */
function hasChildren(route: SideMenu): boolean {
  return Boolean(route.children?.length);
}
