import { state } from '@/main';

export async function getServices(gs, serviceList) {
    console.log(state.getServices)
    if (!(gs instanceof Promise) || !state.user) {
        return;
    }

    try {
        let services = await gs;
        state.blockingPromise = false;
        if (serviceList.value === null) {
            serviceList.value = [];
            for (let region in services) {
                serviceList.value = [...serviceList.value, ...services[region]];
            }

            serviceList.value.sort((a, b) => a.timestamp > b.timestamp ? -1 : a.timestamp < b.timestamp ? 1 : 0);
        }

        return services;

    } catch (err) {
        serviceList.value = null;
        throw err;
    }
}