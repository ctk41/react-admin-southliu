import AxiosRequest from './request';
import { message } from 'antd';
import { getLocalInfo, removeLocalInfo } from '@/utils/local';
import { TOKEN } from '@/utils/config';

// 生成环境所用的接口
const prefixUrl = import.meta.env.VITE_BASE_URL as string;

/**
 * 异常处理
 * @param error - 错误信息
 * @param content - 自定义内容
 */
const handleError = (error: string, content?: string) => {
  console.error('错误信息:', error);
  message.error({
    content: content || error || '服务器错误',
    key: 'error'
  });
};

// 请求配置
export const request = new AxiosRequest({
  baseURL: process.env.NODE_ENV !== 'development' ? prefixUrl : '/api',
  timeout: 180 * 1000,
  interceptors: {
    // 接口请求拦截
    requestInterceptors(res) {
      const token = getLocalInfo(TOKEN) || '';
      if (res?.headers && token) {
        res.headers.Authorization = `Bearer ${token}`;
      }
      return res;
    },
    // 请求拦截超时
    requestInterceptorsCatch(res) {
      message.error('请求超时！');
      return res;
    },
    // 接口响应拦截
    responseInterceptors(res) {
      const { data } = res;
      // 权限不足
      if (data?.code === 401) {
        message.error('权限不足，请重新登录！');
        removeLocalInfo(TOKEN);
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        handleError(data?.message);
        return res;
      }
  
      // 错误处理
      if (data?.code !== 200) {
        handleError(data?.message);
        return res;
      }
  
      return res;
    },
    responseInterceptorsCatch(res) {
      handleError('服务器错误！');
      return res;
    }
  }
});

// 取消请求
export const cancelRequest = (url: string | string[]) => {
  return request.cancelRequest(url);
};

// 取消全部请求
export const cancelAllRequest = () => {
  return request.cancelAllRequest();
};
