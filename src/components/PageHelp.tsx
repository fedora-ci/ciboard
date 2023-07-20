/*
 * This file is part of ciboard

 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
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
import * as React from 'react';
import {
    TextContent,
    Text,
    CodeBlockCode,
    PageSection,
} from '@patternfly/react-core';

import { config } from '../config';
import { PageCommon } from './PageCommon';
import { ExternalLink } from './ExternalLink';

const Help = () => (
    <TextContent>
        <Text component="h1">Welcome to CI Dashboard!</Text>
        <Text component="p">
            CI Dashboard displays details of testing events, which happened for
            the supported artifacts. As the source of information it uses the{' '}
        </Text>
        <ExternalLink href="https://pagure.io/fedora-ci/messages">
            Factory 2.0 CI UMB messages
        </ExternalLink>{' '}
        consumed from the Unified Message Bus (UMB). Currently it makes it
        possible to discover testing events only.
        <h2>Supported artifacts</h2>
        The dashboard currently supports these artifacts
        <ul>
            <li>
                Brew rpm builds - builds from the{' '}
                <ExternalLink href="https://brewweb.engineering.redhat.com">
                    Brew build system
                </ExternalLink>
            </li>
            <li>
                Koji rpm builds - builds from the{' '}
                <ExternalLink href="https://koji.fedoraproject.org/koji">
                    Koji build system
                </ExternalLink>
            </li>
            <li>
                Copr builds - build from the{' '}
                <ExternalLink href="https://copr.devel.redhat.com">
                    internal Copr build system
                </ExternalLink>{' '}
                or{' '}
                <ExternalLink href="https://copr.fedorainfracloud.org">
                    Fedora Copr build system
                </ExternalLink>
            </li>
            <li>
                Red Hat modules - build from{' '}
                <ExternalLink href="http://mbsweb.engineering.redhat.com">
                    Module Build Service
                </ExternalLink>
            </li>
            <li>
                Productmd composes - build from{' '}
                <ExternalLink href="http://mbsweb.engineering.redhat.com">
                    Module Build Service
                </ExternalLink>
            </li>
        </ul>
        <h2>Search</h2>
        <h3>Via menu</h3>
        <p>
            The dashboard provides a simple interface for searching. Currently
            you can search only by artifact name. The name is dependent on the
            type of the artifact.
        </p>
        <p>
            For Brew/Koji rpm builds and Red Hat modules the search value is the
            component name. For Copr builds the artifact name consists from the
            repository name plus the package, e.g. @ksh/latest/ksh.
        </p>
        <h3>Via URL</h3>
        <p>The dashboard provides advanced search via URL:</p>
        <p className="padding-left-20">
            {window.location.origin}
            /#/artifact/ARTIFACT_NAME/FIELD/VALUE[,VALUE,...]?FIELD=VALUE
            {'&'}
            FIELD=VALUE
            {'&'}
            ...
        </p>
        <h4>Examples</h4>
        <p>
            Search all artifacts of build issuers plautrba and lvrabec,
            non-scratch only
        </p>
        <p className="padding-left-20">
            <ExternalLink
                href={`${window.location.origin}/#/artifact/brew-build/issuer/plautrba,lvrabec?scratch=false`}
            >
                {window.location.origin}
                /#/artifact/brew-build/issuer/plautrba,lvrabec?scratch=false
            </ExternalLink>
        </p>
        <p>Search events for modules with name httpd, nginx and llvm-toolset</p>
        <p className="padding-left-20">
            <ExternalLink
                href={`${window.location.origin}/#/artifact/redhat-module/name/httpd,nginx,llvm-toolset`}
            >
                {window.location.origin}
                /#/artifact/redhat-module/name/httpd,nginx,llvm-toolset
            </ExternalLink>
        </p>
        <h4>Possible values for ARTIFACT_NAME</h4>
        <ul>
            <li>brew-build</li>
            <li>copr-build</li>
            <li>koji-build</li>
            <li>redhat-module</li>
        </ul>
        <h4>Possible fields and values</h4>
        <table style={{ width: '100%' }}>
            <tbody>
                <tr>
                    <th>Field</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>aid</td>
                    <td>
                        An integer. Specifies the artifact ID. Dependent on
                        artifact type:
                        <ul>
                            <li>brew-build, koji build - task ID</li>
                            <li>redhat-module - module build ID</li>
                        </ul>
                    </td>
                </tr>
                <tr>
                    <td>component</td>
                    <td>
                        Name of the component, applicable for artifacts
                        brew-build, koji-build and copr-build.
                    </td>
                </tr>
                <tr>
                    <td>name</td>
                    <td>
                        Name of the module, applicable for artifact
                        redhat-module only.
                    </td>
                </tr>
                <tr>
                    <td>nvr</td>
                    <td>
                        NVR of the rpm build, applicable for artifact brew-build
                        and koji-build.
                    </td>
                </tr>
                <tr>
                    <td>nsvc</td>
                    <td>
                        NSVC of the module build, applicable for artifact
                        redhat-module.
                    </td>
                </tr>
                <tr>
                    <td>owner</td>
                    <td>
                        Name of the owner of the artifact, usually who built it.
                    </td>
                </tr>
                <tr>
                    <td>scratch</td>
                    <td>
                        Boolean - true or false. Applicable only for brew build
                        and koji-build.
                    </td>
                </tr>
            </tbody>
        </table>
        <h3>Via GraphQL</h3>
        <p>
            You can construct GraphQL queries and execute them on the
            dashboard's backend GraphQL server. The GraphQL backend is usually
            located at:
        </p>
        <p className="padding-left-20">
            {window.location.origin}
            /graphql
        </p>
        <h4> Disclaimers</h4>
        <p>
            Note: the API is not officially supported and its primary use is for
            the CI Dashboard front-end. It is not guaranteed to be stable and it
            can change arbitrarily without prior notice.
        </p>
        <h4>Examples</h4>
        <p>
            To retrieve build tags by NVR, your query could look something like
            this:
        </p>
        <p className="padding-left-20">
            <CodeBlockCode id="code-content">
                {`query brew {
                    koji_build_tags_by_nvr(nvr: $NVR, instance: rh|fp|cs){
                        arches
                        id
                        locked
                        name
                        perm
                        perm_id}
                }`}
            </CodeBlockCode>
        </p>
        <h2>Onboarding</h2>
        <p>
            To onboard your system to the dashboard, just start sending out
            messages in the Factory 2.0 CI UMB messages format to the specified
            virtual topic namespace. In case of any questions, see Contacts.
        </p>
        <h2>Development / Contribution</h2>
        <p>
            Dashboard is built using React.js, Patternfly and other JS goodies.
        </p>
        <p>
            The project is currently developed on github. Contributions are
            always welcome.
        </p>
        <table style={{ width: '45%' }}>
            <tbody>
                <tr>
                    <td>Fontend:</td>
                    <td>
                        <ExternalLink href="https://github.com/fedora-ci/ciboard/">
                            https://github.com/fedora-ci/ciboard/
                        </ExternalLink>
                    </td>
                </tr>
                <tr>
                    <td>Backend:</td>
                    <td>
                        <ExternalLink href="https://github.com/fedora-ci/ciboard-server/">
                            https://github.com/fedora-ci/ciboard-server/
                        </ExternalLink>
                    </td>
                </tr>
                <tr>
                    <td>Kai:</td>
                    <td>
                        <ExternalLink href="https://github.com/fedora-ci/kaijs/">
                            https://github.com/fedora-ci/kaijs/
                        </ExternalLink>
                    </td>
                </tr>
            </tbody>
        </table>
        <h2>Contacts</h2>
        <p>IRC: #osci or #baseosci</p>
        <p>Mailing list: osci-list@redhat.com baseos-ci@redhat.com</p>
    </TextContent>
);

export function PageHelp() {
    return (
        <PageCommon title={`Help | ${config.defaultTitle}`}>
            <PageSection isFilled>
                <Help />
            </PageSection>
        </PageCommon>
    );
}
