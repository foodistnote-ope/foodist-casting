/**
 * 生年月日から現在の年齢を計算する
 */
export const calculateAge = (birthDate: string): number | undefined => {
    if (!birthDate) return undefined;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return undefined;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

/**
 * 年齢から年代ラベル（20代、30代等）を取得する
 */
export const getAgeGroupFromAge = (age: number | undefined): string | undefined => {
    if (age === undefined) return undefined;
    if (age < 20) return 'その他';
    if (age < 30) return '20代';
    if (age < 40) return '30代';
    if (age < 50) return '40代';
    return '50代以上';
};

/**
 * 生年月日から年代ラベルを直接取得する
 */
export const calculateAgeGroup = (birthDate: string): string | undefined => {
    const age = calculateAge(birthDate);
    return getAgeGroupFromAge(age);
};
