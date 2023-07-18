import { state } from './main.js';
export default class Admin extends Skapi {
    // default email templates
    default_templates = {
        template_verification: {
            sms: '[${service_name}] Verification code: ${code}',
            html: '<p>Verification code: <span style="font-weight: bold">${code}</span></p>',
            subject: '[${service_name}] Verification code'
        },

        template_welcome: {
            html: '<p style="font-weight: bold">Hello ${name}</p><p>Thank you for joining ${service_name}</p><p>Your registered E-Mail is: <span style="font-weight: bold">${email}</span></p><br/><p style="font-weight: bold">${service_name}</p>',
            subject: 'Thank you for joining ${service_name}',
        },

        template_activation: {
            html: '<p>Please activate your account by clicking this <a href="${link}" style="font-weight: bold">LINK</a></p><p>Your activation link is valid for 24 hours</p>',
            subject: '[${service_name}] Account activation'
        }
    };

    services = {};
    region_list = {
        'us31': 'us-east-1',
        'us32': 'us-east-2',
        'us71': 'us-west-1',
        'us72': 'us-west-2',
        'af51': 'af-south-1',
        'ap31': 'ap-east-1',
        'ap43': 'ap-southeast-3',
        'ap51': 'ap-south-1',
        'ap23': 'ap-northeast-3',
        'ap22': 'ap-northeast-2',
        'ap41': 'ap-southeast-1',
        'ap42': 'ap-southeast-2',
        'ap21': 'ap-northeast-1',
        'ca01': 'ca-central-1',
        'eu01': 'eu-central-1',
        'eu71': 'eu-west-1',
        'eu72': 'eu-west-2',
        'eu51': 'eu-south-1',
        'eu73': 'eu-west-3',
        'eu11': 'eu-north-1',
        'me51': 'me-south-1',
        'sa31': 'sa-east-1'
    };

    constructor(service_id = 'us31zettahertzesskpi', owner = 'skapi') {
        super(service_id, owner, { autoLogin: window.localStorage.getItem('remember') === 'true' });
    }

    static async connect(service_id = 'us31zettahertzesskpi', owner = 'skapi') {
        const skapi = new Admin(service_id, owner);
        await skapi.__connection;
        return skapi;
    }

    async AdminLogin(form, option, remember) {
        if (remember) {
            window.localStorage.setItem('remember', 'true');
        }
        else {
            window.localStorage.setItem('remember', 'false');
        }
        return this.login(form, option);
    }

    async AdminLogout() {
        let r = await this.logout();
        state.services = null;
        return r;
    }

    async grantAccess(params) {
        await this.checkAdmin();
        // { service ,user_id, access_group }
        return this.request('grant-access', params, { auth: true });
    }

    async deleteHostFile(params) {
        let { keys, service } = params;
        return this.deleteFiles({
            endpoints: keys,
            service,
            storage: 'host'
        });
    }

    async getServices(id) {
        await this.checkAdmin();
        if (id) {
            let set = await this.request('get-services', id ? { service_id: id } : null, {
                auth: true
            });
            for (let s in set) {
                this.services[s] = set[s];
            }
        }
        else {
            this.services = await this.request('get-services', id ? { service_id: id } : null, {
                auth: true
            });
        }

        return this.services;
    }

    async requireAdmin(opt = { throwError, ignoreVerification }) {
        let { throwError = false, ignoreVerification = false } = opt || {};
        let isAdmin = await this.checkAdmin();
        if (!isAdmin && throwError) {
            throw new SkapiError('No access', { code: 'INVALID_REQUEST' });
        }

        if (!this.__user?.email_verified && !ignoreVerification) {
            throw new SkapiError('E-Mail verification is needed.', { code: 'INVALID_REQUEST' });
        }
    }

    async requestNewsletterSender(service, group_numb) {
        await this.requireAdmin({ throwError: true });
        return this.request('request-newsletter-sender', { service, group_numb }, { auth: true });
    }
    
    async set404(service, subdomain, exec, page404) {
        // page404 - file path in the storage to make 404 page ex) subdomain/error.html
        // exec - 'set' for setting 404 page, 'get' for fetching current file path for 404 page.

        // if exec == 'get', page404 dosent need a value

        await this.requireAdmin({ throwError: true });
        return this.request('set-404', { service, subdomain, page404, exec }, { auth: true });
    }

    async createService(params) {
        /**
            'region': [str, lambda: os.environ['REGION']],
            'name': str,
            'cors': list,
            'api_key': str,
         */
        await this.requireAdmin({ throwError: true });

        if (typeof params.cors === 'string') {
            params.cors = [params.cors];
        }

        let s = await this.request('register-service', Object.assign({ execute: 'create' }, params), { auth: true });

        for (let k in this.default_templates) {
            // default templates
            if (!s[k]) {
                s[k] = this.default_templates[k];
            }
        }

        if (this.services[s.region]) {
            this.services[s.region].push(s);
        }

        else {
            this.services[s.region] = [s];
        }

        return s;
    }

    prepareService(service) {
        // service = service id
        let hasService = null;
        let serviceIndex = NaN;
        let region = this.region_list[service.substring(0, 4)]; // service id: [region 4 char][timestamp 7 char (can be 8 char in about 5 decades...)][random 5 char][suid 4 char]
        if (this.services) {
            // get the service index number
            for (let i = 0; this.services[region].length > i; i++) {
                let s = this.services[region][i];
                if (s.service === service) {
                    hasService = s;
                    serviceIndex = i;
                    break;
                }
            }
        }

        if (!hasService) {
            throw `Service id: ${service} does not exists.`;
        }

        return { service: hasService, index: serviceIndex, region };
    }

    async refreshCDN(params) {
        if (!(await this.checkAdmin())) {
            throw 'admin required.';
        }

        if (!params?.service) {
            throw 'Service ID is required';
        }
        if (!params?.subdomain) {
            throw 'Subdomain is required';
        }

        return this.request('refresh-cdn', {
            service: params.service,
            subdomain: params.subdomain
        }, {
            auth: true,
            method: 'post'
        });

    }

    async registerSubdomain(params) {
        if (!(await this.checkAdmin())) {
            throw 'admin required.';
        }

        if (!params?.service) {
            throw '"service" is required.';
        }

        if (!params?.subdomain) {
            throw '"subdomain" is required.';
        }

        if (params?.exec === 'register') {
            let invalid = [
                'docs',
                'baksa',
                'desktop',
                'mobile',
                'skapi',
                'broadwayinc',
                'broadway',
                'documentation'
            ];

            if (params.subdomain.length < 4) {
                throw "Subdomain has already been taken.";
            }

            if (invalid.includes(params.subdomain)) {
                throw "Subdomain has already been taken.";
            }
        }

        return this.request('register-subdomain', params, {
            auth: true,
            method: 'post'
        });
    }

    async deleteService(service) {
        // service = service id
        await this.requireAdmin({ throwError: true });
        let srv = this.prepareService(service);
        let sIdx = srv.index;
        let region = srv.region;
        let result = await this.request('register-service', {
            service,
            execute: 'delete'
        }, { auth: true });

        this.services[region].splice(sIdx, 1);

        return result;
    }

    async enableService(service) {
        // service = service id
        await this.requireAdmin({ throwError: true });

        let s = this.prepareService(service).service;

        await this.request('register-service', {
            service,
            execute: 'enable'
        }, { auth: true });

        if (s.active === 0) {
            s.active = s.group;
        }

        return s;
    }

    async disableService(service) {
        // service = service id
        await this.requireAdmin({ throwError: true, ignoreVerification: true });

        let s = this.prepareService(service).service;

        await this.request('register-service', {
            service,
            execute: 'disable'
        }, { auth: true });

        if (s.active > 0) {
            s.active = 0;
        }

        return s;
    }

    async updateService(service, params) {
        await this.requireAdmin({ throwError: true });

        /**
            params:
                'name': str,
                'cors': list,
                'api_key': str,
         */
        if (!params || !Object.keys(params).length) {
            throw 'Nothing to update.';
        }

        let s = this.prepareService(service);

        if (typeof params.cors === 'string') {
            params.cors = [params.cors];
        }

        let updated_service = await this.request('register-service', Object.assign({ execute: 'update', service }, params), { auth: true });
        for (let k in this.default_templates) {
            // default templates
            if (!updated_service[k]) {
                updated_service[k] = this.default_templates[k];
            }
        }

        this.services[s.region][s.index] = updated_service;

        return updated_service;
    }

    async blockAccount(params) {
        /**
         * params: {
         *      service: service id,
         *      userId: user id
         * }
         */

        await this.requireAdmin({ throwError: true });
        return await this.request('block-account', { service: params.service, block: params.userId }, { auth: true });
    }

    async unblockAccount(params) {
        /**
         * params: {
         *      service: service id,
         *      userId: user id
         * }
         */
        await this.requireAdmin({ throwError: true });
        return await this.request('block-account', { service: params.service, unblock: params.userId }, { auth: true });
    }

    async getNewsletterSubscribers(params, fetchOptions) {
        /**
         * params: {
         *      service: service id,
         *      email: subscribers email, can be blank
         * }
         */
        await this.requireAdmin({ throwError: true });
        let sub = {
            subscription: params.service,
            group: 0,
            emailSubscription: true,
            service: params.service,
            subscriber: params.email || undefined
        };

        return await this.getSubscriptions(sub, fetchOptions, s => {
            let subscription = {};
            let subSplit = s.sub.split('#');
            subscription.email = subSplit[0];
            subscription.locale = s.loc;
            subscription.timestamp = s.stmp;
            return subscription;
        });
    }

    async deleteAccount(params) {
        /**
         * params: {
         *      service: service id,
         *      userId: user id
         * }
         */
        await this.requireAdmin({ throwError: true });
        if (params.userId === this.__user.user_id) {
            throw 'Users cannot delete their own account.';
        }

        return await this.request('remove-account', { service: params.service, delete: params.userId }, { auth: true });
    }

    async storageInformation(service) {
        // service = service id
        await this.requireAdmin({ throwError: true, ignoreVerification: true });
        return await this.request('storage-info', { service }, { auth: true });
    }

    async deleteNewsletter(params) {
        /**
         * params: {
         *      message_id: message id,
         *      group: message group (int) 0 = newsletter, 1 = service letter
         * }
         */
        await this.requireAdmin({ throwError: true, ignoreVerification: true });
        return await this.request('delete-newsletter', params, { auth: true });
    }

    recordSizeCalculator(item) {
        /*
    
        Caculates record size.
    
        Designed to match how dynamodb storage works.
        Reference: https://dynobase.dev/dynamodb-capacity-and-item-size-calculator/
    
        */

        let total = 0;

        function getSize(i) {
            let byte_size = 0;
            if (i === null)
                byte_size += 1;

            if (typeof i === 'boolean')
                byte_size += 1;

            else if (typeof i === 'number')
                byte_size += Math.round(i.toString().length / 2) + 1;

            else if (typeof i === 'string')
                byte_size += new TextEncoder().encode(i).length;

            else if (typeof i === 'object') {
                byte_size += 3;
                let isArray = Array.isArray(i);
                for (let k in Object.keys(i)) {
                    if (isArray)
                        byte_size += 1;
                    else
                        byte_size += new TextEncoder().encode(k).length;

                    byte_size += getSize(i[k]);
                }
            }

            return byte_size;
        }

        for (let k in item) {
            total += new TextEncoder().encode(k).length;
            total += getSize(item[k]);
        }

        return total;
    }
}
