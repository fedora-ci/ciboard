/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
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

import { CiTest, TestCase, TestSuite } from './types';

/*
 * TODO: We're going to need a unique key for each
 * (test × scenario × system architecture × system variant) combination.
 */
export const FAKE_TESTS: CiTest[] = [
    {
        labels: ['rhel-linux_P9', 'ppc64le', 'python3-libvirt'],
        name: 'leapp.brew-build.upgrade.distro',
        required: true,
        status: 'failed',
        subtitle: 'Depends on osci.brew-build.test-compose.integration.',
        waivable: true,
    },
    {
        labels: ['ppc64le'],
        name: 'baseos-ci.brew-build.ci-dnf-stack-gating.functional',
        required: true,
        status: 'error',
        subtitle:
            'Test failed because of CI infrastructure. Please contact the CI system maintainers.',
        waivable: true,
    },
    {
        labels: ['x86_64'],
        name: 'redhat-cloud-client-configuration.brew-build.tier0.functional',
        required: true,
        status: 'missing',
        waivable: true,
    },
    {
        name: 'osci.brew-build.virtual.always-running',
        required: true,
        status: 'running',
    },
    {
        name: 'osci.brew-build.virtual.always-queued',
        required: true,
        status: 'queued',
    },
    {
        name: 'osci.brew-build.tier0.functional',
        required: true,
        status: 'waived',
    },
    {
        name: 'baseos-ci.brew-build.tier1-legacy.functional',
        required: true,
        status: 'waived',
    },
    {
        name: 'osci.brew-build.installability.functional',
        required: true,
        status: 'passed',
    },
    {
        name: 'osci.brew-build.test-compose.integration',
        required: true,
        status: 'passed',
    },
    {
        name: 'osci.brew-build.rpmdeplint.functional',
        required: true,
        status: 'passed',
    },
    {
        name: 'osci.brew-build.rpminspect.static-analysis',
        required: true,
        status: 'passed',
    },
    {
        labels: ['migrated'],
        name: 'osci.brew-build.gating-yaml.validation',
        required: true,
        status: 'passed',
    },
    {
        labels: ['ppc64le'],
        name: 'redhat-cloud-client-configuration.brew-build.tier0.functional',
        required: false,
        status: 'missing',
    },
    {
        name: 'baseos-ci.brew-build.covscan.static-analysis',
        required: false,
        status: 'passed',
    },
];

export const FAKE_TEST_CASES: TestCase[] = [
    {
        arch: 'x86_64',
        logs: ['log_dir', 'testout.txt'],
        name: '/CoreOS/httpd/Regression/bz1883648-httpd-SSLProxyMachineCertificateFile-non-leaf-certs',
        status: 'fail',
        time: 365,
    },
    {
        arch: 'x86_64',
        logs: ['log_dir', 'testout.txt'],
        name: '/CoreOS/httpd/Regression/bz1493510-add-IP-FREEBIND-support-for-Listen',
        status: 'fail',
        time: 78,
    },
    {
        arch: 'x86_64',
        logs: [
            'log_dir',
            'testout.txt',
            'setup.txt',
            'dmesg.txt',
            'selinux.txt',
        ],
        name: '/CoreOS/httpd/mod_headers/requestheader_edit',
        status: 'pass',
        time: 3994,
    },
    {
        arch: 'x86_64',
        name: '/CoreOS/httpd/Regression/bz517993-updated-welcome-page-branding',
        status: 'pass',
        time: 99,
    },
    {
        arch: 'x86_64',
        name: '/CoreOS/httpd/Regression/bz1680118-httpd-unclean-closure-on-TLSv1_2-reneg',
        status: 'pass',
        time: 169,
    },
    {
        arch: 'x86_64',
        logs: [
            'SYSTEM-ROLE-certificate_tests_basic_self_signed.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-certificate_tests_default.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-certificate_tests_dns_ip_email.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-certificate_tests_fs_attrs.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-cluster_default_collection.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-long_setup_name.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-config_router_firewall_dns.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-config_router_firewall_ipsec.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-stressful_cluster_ipconfig.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-relaxed_cluster_ipconfig.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-foreign_cluster_ipconfig.yml-legacy-ANSIBLE-2.log',
            'SYSTEM-ROLE-forgotten_cluster_ipconfig.yml-legacy-ANSIBLE-2.log',
        ],
        name: '/CoreOS/httpd/Sanity/bz1651376-centralizing-default-index-html-for-httpd',
        status: 'pass',
        time: 141,
    },
    {
        arch: 'x86_64',
        name: '/CoreOS/httpd/mod_proxy/bz1896176-proxy-websocket-idle-timeout',
        status: 'pass',
        time: 505,
    },
    {
        arch: 'x86_64',
        name: '/CoreOS/MySQL-python/Regression/bz150828-Apache-crashes-when-mod-python-and-php-both-access',
        status: 'pass',
        time: 157,
    },
    {
        name: '/CoreOS/gcc/Fake/always-skip',
        status: 'skip',
    },
];

export const FAKE_TEST_SUITES: TestSuite[] = [
    {
        name: 'First suite',
        cases: [FAKE_TEST_CASES[0], FAKE_TEST_CASES[3], FAKE_TEST_CASES[5]],
    },
    {
        name: 'Second suite',
        cases: [FAKE_TEST_CASES[1], FAKE_TEST_CASES[3], FAKE_TEST_CASES[7]],
    },
    {
        name: 'Third suite',
        cases: [FAKE_TEST_CASES[4], FAKE_TEST_CASES[8]],
    },
    {
        name: 'Fourth suite',
        cases: [
            FAKE_TEST_CASES[1],
            FAKE_TEST_CASES[2],
            FAKE_TEST_CASES[4],
            FAKE_TEST_CASES[3],
            FAKE_TEST_CASES[6],
        ],
    },
    {
        name: 'Empty suite',
        cases: [],
    },
];
