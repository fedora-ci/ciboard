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

import * as _ from 'lodash';
import { PropsWithChildren, useContext, useState } from 'react';
import useLocalStorage from 'react-use-localstorage';
import {
    Alert,
    Badge,
    Button,
    Drawer,
    DrawerActions,
    DrawerCloseButton,
    DrawerContent,
    DrawerHead,
    DrawerPanelBody,
    DrawerPanelContent,
    Flex,
    List,
    ListItem,
    Tab,
    Tabs,
    TabTitleText,
    Text,
    TextContent,
    Title,
} from '@patternfly/react-core';
import {
    BookIcon,
    ExclamationCircleIcon,
    InfoCircleIcon,
    RedoIcon,
    ThumbsUpIcon,
    UsersIcon,
} from '@patternfly/react-icons';

import { ExternalLink } from '../ExternalLink';
import { SelectedTestContext } from './contexts';
import { TestSuitesAccordion } from './TestSuitesAccordion';
import { TestStatusIcon } from './TestStatusIcon';
import { GreenwaveWaiver } from '../ArtifactGreenwaveState';
import { CiContact } from './types';
import { Artifact } from '../../artifact';

const DEFAULT_DRAWER_SIZE = '50rem';
const DRAWER_SIZE_STORAGE_KEY = 'ciboard-drawer-size';

/*
function TogglableLabel(props: { outcome: 'pass' | 'fail' }) {
    const { outcome } = props;
    const [toggled, setToggled] = useState(true);

    const color = outcome === 'pass' ? 'green' : 'red';
    const icon =
        outcome === 'pass' ? <CheckCircleIcon /> : <ExclamationCircleIcon />;
    const onClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
        setToggled(!toggled);
        event.preventDefault();
        return false;
    };

    return (
        <Label
            className={toggled ? 'labelToggled' : ''}
            color={color}
            href="#"
            icon={icon}
            onClick={onClick}
        >
            14 {`${outcome}ed`}
        </Label>
    );
}
*/

export function mkSeparatedListNatural(
    elements: React.ReactNode[],
    separator: React.ReactNode = ', ',
    lastSeparator: React.ReactNode = ' and ',
) {
    if (_.isNil(elements)) return null;
    return elements.reduce(
        (acc, el, i) =>
            acc === null ? (
                <>{el}</>
            ) : (
                <>
                    {acc}
                    {i === elements.length - 1 ? lastSeparator : separator}
                    {el}
                </>
            ),
        null,
    );
}

function KnownIssuesTab(props: {}) {
    return (
        <DrawerPanelBody>
            {/* TODO: Replace with real known issues. */}
            <p>Known issues with the CI (if any) will be listed here.</p>
            <List>
                <ListItem>
                    <ExclamationCircleIcon
                        className="pf-u-danger-color-100"
                        title="Blocker issue"
                    />{' '}
                    SP ResultsDB doesn't process messages (
                    <ExternalLink href="https://example.com/KTTY-1916">
                        KTTY-1916
                    </ExternalLink>
                    ).
                </ListItem>
                <ListItem>
                    <InfoCircleIcon
                        className="pf-u-info-color-100"
                        title="Normal issue"
                    />{' '}
                    Test sometimes fails in guest setup stage because of{' '}
                    <ExternalLink href="https://example.com/KTTY-7788">
                        KTTY-7788
                    </ExternalLink>
                    .
                </ListItem>
            </List>
        </DrawerPanelBody>
    );
}

interface DetailsDrawerTabsProps {
    artifact?: Artifact;
}

function DetailsDrawerTabs(props: DetailsDrawerTabsProps) {
    const [activeTabKey, setActiveTabKey] = useState(0);

    const tabs = [
        {
            title: 'Results',
            content: <TestSuitesAccordion artifact={props.artifact} />,
        },
        {
            title: 'CI details',
            content: (
                <DrawerPanelBody>
                    CI team name and contact info (email, IRC, GChat) will be
                    here.
                </DrawerPanelBody>
            ),
        },
        {
            title: (
                // TODO: Only show if there are any known issues.
                // TODO: Pull real known issues from `selectedTest` metadata.
                <>
                    Known issues <Badge isRead>2</Badge>
                </>
            ),
            content: <KnownIssuesTab />,
        },
        {
            title: 'Metadata',
            content: (
                <DrawerPanelBody>
                    Test result metadata will be here (time submitted, UMB
                    message ID, datagrapper link, ResultsDB link, etc.)
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
            {tabs.map(({ content, title }, i) => (
                <Tab
                    eventKey={i}
                    key={i}
                    title={<TabTitleText>{title}</TabTitleText>}
                >
                    {content}
                </Tab>
            ))}
        </Tabs>
    );
}

interface ContactWidgetProps {
    contact?: CiContact;
}

function ContactWidget({ contact }: ContactWidgetProps) {
    if (!contact) return null;

    let contactLinks: JSX.Element[] = [];

    if (contact.slackChannelUrl) {
        contactLinks.push(
            <ExternalLink
                className="pf-u-font-weight-bold"
                href={contact.slackChannelUrl}
            >
                via Slack
            </ExternalLink>,
        );
    }
    if (contact.gchatRoomUrl) {
        contactLinks.push(
            <ExternalLink
                className="pf-u-font-weight-bold"
                href={contact.gchatRoomUrl}
            >
                via Chat
            </ExternalLink>,
        );
    }
    if (contact.email) {
        contactLinks.push(
            <>
                via email at{' '}
                <ExternalLink
                    className="pf-u-font-weight-bold"
                    href={`mailto:${contact.email}`}
                >
                    {contact.email}
                </ExternalLink>
            </>,
        );
    }

    let reachOutText = contactLinks.length ? (
        <>
            If you need help with this test, you can reach out to the team{' '}
            {mkSeparatedListNatural(contactLinks, ', ', ' or ')}.
        </>
    ) : null;

    return (
        <Alert
            customIcon={<UsersIcon />}
            isInline
            title={`Test owned by ${contact.team}`}
            variant="info"
        >
            <TextContent>
                <Text>
                    This test result is provided by the <b>{contact.team}</b>{' '}
                    team. {reachOutText}
                </Text>
            </TextContent>
        </Alert>
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

    const onCloseClick = () => props.onClose && props.onClose();
    const onResize = (newWidth: number) => setDrawerSize(`${newWidth}px`);
    const statusIcon = selectedTest ? (
        <TestStatusIcon
            status={selectedTest.status}
            style={{
                marginRight: 'var(--pf-global--spacer--sm)',
                verticalAlign: '-0.125em',
            }}
        />
    ) : null;

    const panelContent = (
        <DrawerPanelContent
            defaultSize={drawerSize}
            isResizable
            minSize="20rem"
            onResize={onResize}
        >
            <DrawerHead>
                <Title className="pf-u-pb-sm" headingLevel="h3" size="xl">
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
                    {selectedTest?.waivable && (
                        <Button
                            className="pf-u-p-0"
                            icon={<ThumbsUpIcon />}
                            isDisabled
                            variant="link"
                        >
                            Waive
                        </Button>
                    )}
                    {selectedTest?.rerunUrl && (
                        <Button
                            className="pf-u-p-0"
                            component={ExternalLink}
                            href={selectedTest.rerunUrl}
                            icon={<RedoIcon />}
                            variant="link"
                        >
                            Rerun
                        </Button>
                    )}
                    {selectedTest?.docsUrl && (
                        <Button
                            className="pf-u-p-0"
                            component={ExternalLink}
                            href={selectedTest.docsUrl}
                            icon={<BookIcon />}
                            variant="link"
                        >
                            Docs
                        </Button>
                    )}
                    {selectedTest?.contact?.reportIssueUrl && (
                        <Button
                            className="pf-u-p-0"
                            component={ExternalLink}
                            href={selectedTest.contact.reportIssueUrl}
                            icon={<ExclamationCircleIcon />}
                            variant="link"
                        >
                            Report issue
                        </Button>
                    )}
                </Flex>
            </DrawerHead>
            <DrawerPanelBody className="pf-u-pb-sm">
                <ContactWidget contact={selectedTest?.contact} />
                {(selectedTest?.status === 'error' ||
                    (selectedTest?.status === 'waived' &&
                        selectedTest.error)) && (
                    <Alert
                        className="pf-u-mt-md"
                        isInline
                        title="Test not completed"
                        variant="danger"
                    >
                        {selectedTest.error && (
                            <TextContent className="pf-u-font-size-sm">
                                <Text>
                                    <strong>Reason:</strong>{' '}
                                    {selectedTest.error.reason}
                                </Text>
                                {selectedTest.error.issue_url && (
                                    <Text>
                                        <ExternalLink
                                            href={selectedTest.error.issue_url}
                                        >
                                            Related issue report
                                        </ExternalLink>
                                    </Text>
                                )}
                            </TextContent>
                        )}
                        {!selectedTest.error && (
                            <TextContent className="pf-u-font-size-sm">
                                <Text>
                                    This test has failed to complete, but the CI
                                    system provided no more information. Please
                                    contact the team listed above for guidance.
                                </Text>
                            </TextContent>
                        )}
                    </Alert>
                )}
                {selectedTest?.status === 'failed' && (
                    <Alert
                        className="pf-u-mt-md"
                        isInline
                        title="Test failed"
                        variant="danger"
                    >
                        <TextContent className="pf-u-font-size-sm">
                            {/* TODO: Replace with real error message. */}
                            <Text>
                                This test has failed. Please see the list below
                                for individual test cases.
                            </Text>
                        </TextContent>
                    </Alert>
                )}
                {selectedTest?.waiver && (
                    <GreenwaveWaiver waiver={selectedTest?.waiver} />
                )}
            </DrawerPanelBody>
            <DetailsDrawerTabs
                artifact={props.artifact}
                // TODO: Use a unique ID for the `key` prop instead of `selectedTest?.name`.
                key={selectedTest?.name}
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
