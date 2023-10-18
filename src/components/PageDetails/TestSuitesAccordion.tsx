/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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

import _ from 'lodash';
import pako from 'pako';
import { Buffer } from 'buffer';
import { useContext, useState } from 'react';
import {
    Alert,
    Accordion,
    AccordionItem,
    AccordionToggle,
    DrawerPanelBody,
    AccordionContent,
} from '@patternfly/react-core';
import update from 'immutability-helper';

import { TestSuite } from '../../testsuite';

import './index.css';
import {
    getMsgId,
    getXunit,
    Artifact,
    getMsgBody,
    isAChildSchemaMsg,
    getArtifactChildren,
    BrokerSchemaMsgBody,
} from '../../types';
import { xunitParser } from '../../utils/xunitParser';
import { TestStatusIcon } from '../../utils/utils';
import { SelectedTestContext } from './contexts';
import { TestSuiteDisplay } from '../TestSuites';

export interface TestSuitesAccordionProps {
    artifact?: Artifact;
}

export function TestSuitesAccordion(props: TestSuitesAccordionProps) {
    const [expandedSuites, setExpandedSuites] = useState<
        Partial<Record<number, boolean>>
    >({});
    const selectedTest = useContext(SelectedTestContext);
    const { artifact } = props;
    let error: string | undefined;
    let suites: TestSuite[] | undefined;
    if (!artifact || !selectedTest) return null;

    const aChildren = getArtifactChildren(artifact);
    const aChild = _.find(
        /** this is a bit strange, that received data doesn't propage to original
         * artifact object. Original artifact.states objects stays old */
        aChildren,
        (child) => {
            console.log('XXXXXX', child);
            const msgId = getMsgId(child);
            return msgId === selectedTest.messageId;
        },
    );
    if (!_.isNil(aChild) && isAChildSchemaMsg(aChild)) {
        const msgBody = getMsgBody(aChild);
        const xunitRaw = getXunit(msgBody as BrokerSchemaMsgBody);
        if (xunitRaw && !_.isEmpty(xunitRaw)) {
            try {
                /** Decode base64 encoded gzipped data */
                const compressed = Buffer.from(xunitRaw, 'base64');
                const decompressed = pako.inflate(compressed);
                const utf8Decoded = Buffer.from(decompressed).toString('utf8');
                suites = xunitParser(utf8Decoded);
            } catch (err) {
                error = _.toString(err);
                console.error(`Cannot parse detailed results:`, err);
            }
        }
    }

    if (error) {
        return (
            <DrawerPanelBody>
                <Alert
                    isInline
                    title="Detailed results not available"
                    variant="danger"
                >
                    Could not retrieve detailed test results: {error}
                </Alert>
            </DrawerPanelBody>
        );
    }

    if (_.isEmpty(suites) || !suites) {
        return (
            <DrawerPanelBody>
                <Alert
                    isInline
                    title="Detailed results not available"
                    variant="info"
                >
                    The CI system did not provide detailed results for this test
                    run.
                </Alert>
            </DrawerPanelBody>
        );
    }

    /*
     * Automatically expand the only test suite if there's only one.
     * Note that the `_.isEmpty()` condition is only true on the first
     * render so user interaction doesn't retrigger the change state
     * and doesn't cause an infinite loop.
     */
    if (suites.length === 1 && _.isEmpty(expandedSuites)) {
        setExpandedSuites({ 0: true });
    }

    /*
     * Similarly, if there are multiple test suites, expand those that
     * contain failed or errored test cases.
     */
    if (suites.length > 1 && _.isEmpty(expandedSuites)) {
        const expandedPairs = suites.map((suite, index) => {
            const erroredCount = suite.count['error'] || 0;
            const failedCount = suite.count['fail'] || 0;
            return [index, erroredCount + failedCount > 0];
        });
        setExpandedSuites(_.fromPairs(expandedPairs));
    }

    const onToggle = (index: number): void => {
        const newExpandedIds = update(expandedSuites, {
            $toggle: [index],
        });
        setExpandedSuites(newExpandedIds);
    };

    return (
        <Accordion isBordered>
            {suites.map((suite, index) => {
                const { _uuid, name, status } = suite;
                const statusIcon = (
                    <TestStatusIcon
                        status={status}
                        style={{
                            marginRight: 'var(--pf-global--spacer--sm)',
                            verticalAlign: '-0.125em',
                        }}
                    />
                );

                return (
                    <AccordionItem key={index}>
                        <AccordionToggle
                            id={_uuid}
                            isExpanded={expandedSuites[index]}
                            onClick={() => onToggle(index)}
                        >
                            {statusIcon}
                            {name}
                        </AccordionToggle>
                        <AccordionContent isHidden={!expandedSuites[index]}>
                            <TestSuiteDisplay suite={suite} />
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}
