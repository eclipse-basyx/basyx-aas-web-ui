export async function upsertDescriptor (
  isCreate: boolean,
  postAction: () => Promise<boolean>,
  putAction: () => Promise<boolean>,
): Promise<boolean> {
  return isCreate
    ? (await postAction()) || (await putAction())
    : (await putAction()) || (await postAction())
}
