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
import { ArtifactType } from './artifact';

/**
 * CI Dashboard global configuration.
 */
export const config = {
    defaultTitle: 'CI Dashboard',
    graphQlServerUrl:
        /*
         * By default, we assume the GraphQL server endpoint is located at `/graphql`
         * on the same server as the frontend. For local development, one may use
         * the internal development instance of the GraphQL server. This URL can be
         * overriden using the `REACT_APP_GRAPHQL_SERVER_URL` environment variable.
         */
        process.env.REACT_APP_GRAPHQL_SERVER_URL ?? '/graphql',
    greenwave: {
        url: 'https://greenwave.engineering.redhat.com',
    },
    kai: {
        url: 'https://kai.osci.redhat.com',
    },
    koji: {
        cs: {
            webUrl: 'https://kojihub.stream.centos.org/koji',
        },
        fp: {
            webUrl: 'https://koji.fedoraproject.org/koji',
        },
        rh: {
            webUrl: 'https://brewweb.engineering.redhat.com/brew',
        },
    },
    mbs: {
        cs: {
            // CentOS Stream has no mbs-ui instance.
            webUrl: null,
        },
        fp: {
            webUrl: 'https://release-engineering.github.io/mbs-ui/',
        },
        rh: {
            webUrl: 'https://mbsweb.engineering.redhat.com/mbs-ui/',
        },
    },
    waiverdb: {
        url: 'https://waiverdb.engineering.redhat.com',
    },
    datagrepperFedora: {
        url: 'https://apps.fedoraproject.org/datagrepper',
    },
    datagrepperRH: {
        url: 'https://datagrepper.engineering.redhat.com',
    },
    sst: {
        url: 'https://sst.osci.redhat.com',
    },
    et: {
        url: 'https://errata.engineering.redhat.com/',
        bz: 'https://bugzilla.redhat.com/',
    },
};

export const mappingDatagrepperUrl: Record<ArtifactType, string> = {
    'brew-build': config.datagrepperRH.url,
    'koji-build': config.datagrepperFedora.url,
    'copr-build': config.datagrepperFedora.url,
    'redhat-module': config.datagrepperRH.url,
    'redhat-container-image': config.datagrepperRH.url,
    'koji-build-cs': config.datagrepperFedora.url,
    'productmd-compose': config.datagrepperRH.url,
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
            'redhat-container-image': 'cvp_default',
        },
        product_version: (nvr: string, artifactType: string) => {
            const rhel_version = getOSVersionFromNvr(nvr, artifactType);
            switch (artifactType) {
                case 'brew-build':
                    return `rhel-${rhel_version}`;
                case 'redhat-module':
                    return `rhel-${rhel_version}`;
                case 'redhat-container-image':
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
    gating_tests_overview:
        'https://docs.engineering.redhat.com/display/RHELPLAN/Available+tests+and+gating+overview',
    manual_gating_workflow:
        'https://docs.engineering.redhat.com/display/RHELPLAN/Manual+Gating+workflow',
    waiving:
        'https://source.redhat.com/groups/public/factory-2/factory_20_wiki/waiving_test_failures_greenwave_waiverdb_and_resultsdb#jive_content_id_Waiving_via_CI_Dashboard',
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
