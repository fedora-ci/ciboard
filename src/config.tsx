/*
 * This file is part of ciboard

 * Copyright (c) 2022 Andrei Stepanov <astepano@redhat.com>
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { getOSVersionFromNvr } from './utils/artifactUtils';

/*
 *  CI Dashboard configuration file
 */

export const config = {
    defaultTitle: 'CI Dashboard',
    kai: {
        url: 'https://kai.osci.redhat.com',
    },
    greenwave: {
        url: 'https://greenwave.engineering.redhat.com',
    },
    waiverdb: {
        url: 'https://waiverdb.engineering.redhat.com',
    },
    datagrepper: {
        url: 'https://apps.fedoraproject.org/datagrepper',
    },
    sst: {
        url: 'https://sst.osci.redhat.com',
    },
};

export const kai = {
    search: new URL('v1/artifact/search', config.kai.url),
};

export const greenwave = {
    decision: {
        api_url: new URL('api/v1.0/decision', config.greenwave.url),
        context: {
            'brew-build': 'osci_compose_gate',
            'redhat-module': 'osci_compose_gate_modules',
            'redhat-container': 'cvp_default',
        },
        product_version: (nvr: string, artifactType: string) => {
            const rhel_version = getOSVersionFromNvr(nvr, artifactType);
            switch (artifactType) {
                case 'brew-build':
                    return `rhel-${rhel_version}`;
                case 'redhat-module':
                    return `rhel-${rhel_version}`;
                case 'redhat-container':
                    return 'cvp';
                default:
                    console.log(
                        'Cannot construct product verstion for',
                        nvr,
                        artifactType,
                    );
                    return 'unknown_product_version';
            }
        },
    },
};

export const docs = {
    waiving:
        'https://mojo.redhat.com/docs/DOC-1166445#jive_content_id_Waiving_via_CI_Dashboard',
};

export const waiverdb = {
    waivers: {
        api_url: new URL('/api/v1.0/waivers/', config.waiverdb.url),
    },
};

export const sst = {
    list: {
        json_url: new URL('/results/sstlist.json', config.sst.url),
    },
};

export const info = {
    team: 'OSCI',
    contact: '#osci on Red Hat IRC, email: osci-list@redhat.com',
};

export const messages = {
    kaiConnectionError: (
        <div>
            <div>
                <strong>
                    Note that during weekends the backend can be down for
                    maintanance. Please retry later.
                </strong>
            </div>
            <br />
            <div>
                Make sure you have Red Hat internal CA imported into your
                browser, you are connected to the internal network and and you
                are not using the corporate proxy.
            </div>
            <div>
                You can install CA from {"CSB's"} rpms:{' '}
                <a href="http://hdn.corp.redhat.com/rhel7-csb-stage/repoview/redhat-internal-cert-install.html">
                    http://hdn.corp.redhat.com/rhel7-csb-stage/repoview/redhat-internal-cert-install.html
                </a>
            </div>
            <div>
                If that does not help, contact {info.team} team, {info.contact}
            </div>
        </div>
    ),
};
