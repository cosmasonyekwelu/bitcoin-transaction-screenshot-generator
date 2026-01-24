/* charts date utils */
export const ymd = (d) => d.toISOString().slice(0, 10);

export const dayStart = (unix, deltaDays = 0) => {
  const d = new Date(Number(unix) * 1000);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  d.setUTCHours(0, 0, 0, 0);
  return ymd(d);
};
