import { useMemo, useEffect } from "react";
import {
  UseFormRegister,
  FieldValues,
  Path,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
  PathValue,
} from "react-hook-form";
import { RENTAL_COMPANIES, Company } from "@/constants/rental-companies";
import styles from "./region-store-selector.module.css";

// (株) を除去するヘルパー関数
const formatLabel = (label: string): string => {
  return label.replace("(株)", "").trim();
};

// このコンポーネントが受け取るPropsの型を定義
type RegionStoreSelectorProps<T extends FieldValues> = {
  labelPrefix: "出発" | "返却";
  regionFieldName: Path<T>;
  storeFieldName: Path<T>;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
};

// パフォーマンスが問題になった場合、memo化を検討してください。
// 現状では、レンダリングコストが低く、不要なオーバーヘッドを避けるためmemo化していません。
export const RegionStoreSelector = <T extends FieldValues>({
  labelPrefix,
  regionFieldName,
  storeFieldName,
  register,
  watch,
  setValue,
  errors,
}: RegionStoreSelectorProps<T>) => {
  // 親から渡されたフィールド名を元に、対応する地区の値を監視
  const watchedRegion = watch(regionFieldName);

  // 選択された地区に基づいて、表示する会社のリストを動的に生成
  const availableCompanies = useMemo(() => {
    if (!watchedRegion) return []; // 地区が選択されていなければ空配列
    const regionData = RENTAL_COMPANIES.find((r) => r.label === watchedRegion);
    return regionData ? regionData.companies : [];
  }, [watchedRegion]); // watchedRegionが変更されたときだけ再計算

  // 地区が変更されたら、店舗の選択をリセットする
  useEffect(() => {
    // ユーザーが地区を変更した際に、出発店舗の選択値をリセット
    setValue(storeFieldName, "" as PathValue<T, Path<T>>, {
      shouldValidate: true,
    });
  }, [watchedRegion, setValue, storeFieldName]);

  return (
    <div className={styles.selectorGroup}>
      {/* 1. 地区選択 */}
      <label>
        <span>{labelPrefix}地区</span>
        <select
          {...register(regionFieldName, {
            required: `${labelPrefix}地区の選択は必須です`,
          })}
          defaultValue="all"
        >
          <option value="all">-- すべて --</option>
          {RENTAL_COMPANIES.map((region) => (
            <option key={region.label} value={region.label}>
              {region.label}
            </option>
          ))}
        </select>
        {errors.regionFieldName && (
          <p className={styles.error}>
            {errors.regionFieldName.message?.toString()}
          </p>
        )}
      </label>

      {/* 2. 店舗選択 */}
      <label>
        <span>{labelPrefix}店舗</span>
        <select
          {...register(storeFieldName, {
            required: `${labelPrefix}店舗の選択は必須です`,
          })}
          disabled={!watchedRegion || availableCompanies.length === 0}
          defaultValue="all"
        >
          <option value="all">-- すべて --</option>
          {availableCompanies.map((company: Company) => (
            <option key={company.value} value={formatLabel(company.label)}>
              {formatLabel(company.label)}
            </option>
          ))}
        </select>
        {errors.storeFieldName && (
          <p className={styles.error}>
            {errors.storeFieldName.message?.toString()}
          </p>
        )}
      </label>
    </div>
  );
};
