import { recomputeProfessionalRatings } from '../../../../lib/professional-profile-mapper';

async function syncRatings(result: { professional?: { id?: number } | number | null }) {
  const professional = result?.professional;
  const professionalId =
    typeof professional === 'number' ? professional : professional?.id;
  if (!professionalId) return;
  await recomputeProfessionalRatings(professionalId);
}

export default {
  async afterCreate(event: { result: { professional?: { id?: number } | number | null } }) {
    await syncRatings(event.result);
  },

  async afterUpdate(event: { result: { professional?: { id?: number } | number | null } }) {
    await syncRatings(event.result);
  },

  async afterDelete(event: { result: { professional?: { id?: number } | number | null } }) {
    await syncRatings(event.result);
  },
};
