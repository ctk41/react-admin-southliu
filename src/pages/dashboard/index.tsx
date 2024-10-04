import type { FormData } from '#/form';
import { useCallback, useEffect, useState } from 'react';
import { getDataTrends } from '@/servers/dashboard';
import { searchList } from './model';
import { useTranslation } from 'react-i18next';
import { useUnactivate } from 'react-activation';
import { checkPermission } from '@/utils/permissions';
import { useCommonStore } from '@/hooks/useCommonStore';
import BaseSearch from '@/components/Search/BaseSearch';
import BaseContent from '@/components/Content/BaseContent';
import Bar from './components/Bar';
import Line from './components/Line';
import Block from './components/Block';
import BaseCard from '@/components/Card/BaseCard';

// 初始化搜索
const initSearch = {
  pay_date: ['2022-10-19', '2022-10-29']
};

function Dashboard() {
  const { t } = useTranslation();
  const [isLoading, setLoading] = useState(false);
  const { permissions } = useCommonStore();
  const isPermission = checkPermission('/dashboard', permissions);

  /**
   * 搜索提交
   * @param values - 表单返回数据
   */
  const handleSearch = useCallback(async (values: FormData) => {
    // 数据转换
    values.all_pay = values.all_pay ? 1 : undefined;

    const query = { ...values };
    try {
      setLoading(true);
      await getDataTrends(query);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch(initSearch);
  }, [handleSearch]);

  useUnactivate(() => {
    console.log('退出时执行');
  });

  return (
    <BaseContent isPermission={isPermission}>
      <BaseCard>
        <BaseSearch
          list={searchList(t)}
          data={initSearch}
          isLoading={isLoading}
          handleFinish={handleSearch}
        />
      </BaseCard>

      <BaseCard className='mt-10px'>
        <div className='py-10px'>
          <Block />
        </div>

        <div className='flex justify-between w-full'>
          <Line />
          <Bar />
        </div>
      </BaseCard>
    </BaseContent>
  );
}

export default Dashboard;
