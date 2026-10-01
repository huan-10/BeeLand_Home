import { Redirect, useLocalSearchParams } from 'expo-router';

/** Đường dẫn rút gọn /contract/[id] → màn chi tiết /contracts/[id]. */
export default function ContractAlias() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/contracts/[id]', params: { id: id ?? '' } }} />;
}
