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
import { PropsWithChildren, useContext, useState } from 'react';
import useLocalStorage from 'react-use-localstorage';
import {
    Tab,
    Flex,
    Tabs,
    Text,
    Title,
    Alert,
    Badge,
    Button,
    Drawer,
    DrawerHead,
    TextContent,
    TabTitleText,
    DrawerActions,
    DrawerContent,
    DrawerPanelBody,
    DrawerCloseButton,
    DrawerPanelContent,
} from '@patternfly/react-core';
import {
    BookIcon,
    RedoIcon,
    HandPaperIcon,
    ExclamationCircleIcon,
} from '@patternfly/react-icons';

import './index.css';
import { CiTest } from './types';
import { KnownIssues } from './KnownIssues';
import { WaiveButton } from './WaiveButton';
import { TestStatusIcon } from './TestStatusIcon';
import { ExternalLink } from '../ExternalLink';
import { TestResultMetadata } from './TestResultMetadata';
import { SelectedTestContext } from './contexts';
import { TestSuitesAccordion } from './TestSuitesAccordion';
import { TestResultQuickLinks } from './TestResultQuickLinks';
import { LinkifyNewTab, timestampForUser } from '../../utils/utils';
import { ContactWidget } from './ContactWidget';
import { Artifact, GreenwaveWaiveType } from '../../types';

const DEFAULT_DRAWER_SIZE = '50rem';
const DRAWER_SIZE_STORAGE_KEY = 'ciboard-drawer-size';

interface DetailsDrawerTabsProps {
    artifact?: Artifact;
    knownIssues?: CiTest['knownIssues'];
}

function DetailsDrawerTabs(props: DetailsDrawerTabsProps) {
    const [activeTabKey, setActiveTabKey] = useState(0);

    const { knownIssues } = props;

    const tabs = [
        {
            title: 'Results',
            content: (
                <>
                    <TestResultQuickLinks />
                    <TestSuitesAccordion artifact={props.artifact} />
                </>
            ),
        },
        {
            title: (
                <>
                    Known issues <Badge isRead>{knownIssues?.length}</Badge>
                </>
            ),
            // Hide the known issues tab if there are no known issues.
            content: !_.isEmpty(knownIssues) ? (
                <DrawerPanelBody>
                    <KnownIssues issues={knownIssues} />
                </DrawerPanelBody>
            ) : undefined,
        },
        {
            title: 'Metadata',
            content: (
                <DrawerPanelBody>
                    <TestResultMetadata artifact={props.artifact} />
                </DrawerPanelBody>
            ),
        },
    ];

    return (
        <Tabs
            activeKey={activeTabKey}
            inset={{ default: 'insetLg' }}
            onSelect={(_event, tabIndex) => {
                setActiveTabKey(Number(tabIndex));
            }}
        >
            {tabs.map(({ content, title }, i) =>
                // Only show the tab if it has any content.
                !_.isNil(content) ? (
                    <Tab
                        eventKey={i}
                        key={i}
                        title={<TabTitleText>{title}</TabTitleText>}
                    >
                        {content}
                    </Tab>
                ) : undefined,
            )}
        </Tabs>
    );
}

export type DetailsDrawerProps = PropsWithChildren<{
    artifact?: Artifact;
    onClose?(): void;
}>;

/*
 * Code example taken from the Patternfly docs: https://www.patternfly.org/v4/components/drawer
 */
export function DetailsDrawer(props: DetailsDrawerProps) {
    const [drawerSize, setDrawerSize] = useLocalStorage(
        DRAWER_SIZE_STORAGE_KEY,
        DEFAULT_DRAWER_SIZE,
    );
    const selectedTest = useContext(SelectedTestContext);
    const isExpanded = !_.isNil(selectedTest);

    const { artifact } = props;
    if (!artifact) return null;

    const onCloseClick = () => props.onClose && props.onClose();
    const onResize = (newWidth: number) => setDrawerSize(`${newWidth}px`);
    const statusIcon = selectedTest ? (
        <TestStatusIcon
            status={selectedTest.status}
            style={{
                marginRight: 'var(--pf-v5-global--spacer--sm)',
                verticalAlign: '-0.125em',
            }}
        />
    ) : null;

    /*
     * Action and support buttons.
     */
    const docsButton = selectedTest?.docsUrl && (
        <Button
            component={ExternalLink}
            href={selectedTest.docsUrl}
            icon={<BookIcon />}
            variant="link"
        >
            Docs
        </Button>
    );
    const reportIssueButton = selectedTest?.contact?.reportIssueUrl && (
        <Button
            component={ExternalLink}
            href={selectedTest.contact.reportIssueUrl}
            icon={<ExclamationCircleIcon />}
            variant="link"
        >
            Report issue
        </Button>
    );
    const rerunButton = selectedTest?.rerunUrl && (
        <Button
            component={ExternalLink}
            href={selectedTest.rerunUrl}
            icon={<RedoIcon />}
            variant="link"
        >
            Rerun
        </Button>
    );
    const waiveButton = selectedTest?.waivable && (
        <WaiveButton artifact={artifact} ciTest={selectedTest} />
    );

    /*
     * Custom alerts and widgets for error states and additional info.
     */
    const contactWidget = <ContactWidget contact={selectedTest?.contact} />;
    const descriptionWidget = !_.isEmpty(selectedTest?.description) && (
        <TextContent className="pf-v5-u-mb-md">
            <Text>
                <b>Description:</b>{' '}
                <LinkifyNewTab>{selectedTest?.description}</LinkifyNewTab>
            </Text>
        </TextContent>
    );
    const noteWidget = !_.isEmpty(selectedTest?.note) && (
        <Alert isInline title="Note from CI system" variant="info">
            {selectedTest?.note}
        </Alert>
    );
    const shouldShowError =
        selectedTest?.status === 'error' ||
        (!_.isNil(selectedTest?.waiver) && selectedTest?.error);
    const errorAlert = shouldShowError && (
        <Alert
            className="pf-v5-u-mt-md"
            isInline
            title="Test not completed"
            variant="danger"
        >
            {selectedTest.error && (
                <TextContent className="pf-v5-u-font-size-sm">
                    <Text>
                        <strong>Reason:</strong> {selectedTest.error.reason}
                    </Text>
                    {selectedTest.error.issue_url && (
                        <Text>
                            <ExternalLink href={selectedTest.error.issue_url}>
                                Related issue report
                            </ExternalLink>
                        </Text>
                    )}
                </TextContent>
            )}
            {!selectedTest.error && (
                <TextContent className="pf-v5-u-font-size-sm">
                    <Text>
                        This test has failed to complete, but the CI system
                        provided no more information. Please contact the team
                        listed above for guidance.
                    </Text>
                </TextContent>
            )}
        </Alert>
    );
    const failedAlert = selectedTest?.status === 'failed' && (
        <Alert
            className="pf-v5-u-mt-md"
            isInline
            title="Test failed"
            variant="danger"
        >
            <TextContent className="pf-v5-u-font-size-sm">
                {selectedTest.error && (
                    // Show error message provided by CI if available.
                    <Text>
                        <b>Error:</b> {selectedTest.error.reason}
                    </Text>
                )}
                {!selectedTest.error && (
                    <Text>
                        This test has failed, but no message was provided by the
                        CI. Please inspect the list of test cases below, if
                        available, for details.
                    </Text>
                )}
            </TextContent>
        </Alert>
    );
    const waiverWidget = selectedTest?.waiver && (
        <GreenwaveWaiver waiver={selectedTest?.waiver} />
    );

    const panelContent = (
        <DrawerPanelContent
            className="detailsDrawerPanel"
            defaultSize={drawerSize}
            isResizable
            minSize="20rem"
            onResize={(_event, newWidth: number) => onResize(newWidth)}
        >
            <DrawerHead>
                <Title className="pf-v5-u-pb-sm" headingLevel="h3" size="xl">
                    {statusIcon}
                    {selectedTest?.name}
                </Title>
                <DrawerActions>
                    <DrawerCloseButton onClick={onCloseClick} />
                </DrawerActions>
                <Flex
                    spaceItems={{
                        default: 'spaceItemsLg',
                    }}
                >
                    {waiveButton}
                    {rerunButton}
                    {docsButton}
                    {reportIssueButton}
                </Flex>
            </DrawerHead>
            <DrawerPanelBody className="pf-v5-u-pb-sm">
                {descriptionWidget}
                {noteWidget}
                {contactWidget}
                {errorAlert}
                {failedAlert}
                {waiverWidget}
            </DrawerPanelBody>
            <DetailsDrawerTabs
                artifact={props.artifact}
                /*
                 * Making the test name the element key makes sure that the child component
                 * is re-rendered and state is reset after a new test is selected.
                 */
                key={selectedTest?.name}
                knownIssues={selectedTest?.knownIssues}
            />
        </DrawerPanelContent>
    );

    return (
        <Drawer isExpanded={isExpanded} position="right">
            <DrawerContent panelContent={panelContent}>
                {props.children}
            </DrawerContent>
        </Drawer>
    );
}

export interface GreenwaveWaiverProps {
    waiver?: GreenwaveWaiveType;
}

export const GreenwaveWaiver: React.FC<GreenwaveWaiverProps> = (props) => {
    const { waiver } = props;
    if (!waiver) return null;
    const humanTime = timestampForUser(waiver.timestamp);
    return (
        <Alert
            className="pf-v5-u-mt-md"
            customIcon={<HandPaperIcon />}
            isExpandable
            isInline
            title="Test result waived"
            variant="warning"
        >
            <TextContent className="pf-v5-u-font-size-sm">
                <Text component="p">
                    This test result was waived by <b>{waiver.username}</b> on{' '}
                    {humanTime} with the following comment:
                </Text>
                <Text className="pf-v5-u-py-xs" component="blockquote">
                    <LinkifyNewTab>{waiver.comment}</LinkifyNewTab>
                </Text>
            </TextContent>
        </Alert>
    );
};
