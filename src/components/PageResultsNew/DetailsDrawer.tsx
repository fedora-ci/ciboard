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
    HandPaperIcon,
    InfoCircleIcon,
    RedoIcon,
    ThumbsUpIcon,
} from '@patternfly/react-icons';

import { LinkifyNewTab, TestStatusIcon } from '../../utils/artifactUtils';
import { ExternalLink } from '../ExternalLink';
import { SelectedTestContext } from './contexts';
import { FAKE_TEST_SUITES } from './fakeData';
import { TestSuitesAccordion } from './TestSuitesAccordion';

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

function DetailsDrawerTabs(_props: {}) {
    const [activeTabKey, setActiveTabKey] = useState(0);
    const testSuites = FAKE_TEST_SUITES;

    const tabs = [
        {
            title: 'Results',
            content: <TestSuitesAccordion suites={testSuites} />,
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

export type DetailsDrawerProps = PropsWithChildren<{
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
            style={{ verticalAlign: '-.125em' }}
        />
    ) : null;

    // TODO: Persist the drawer width across pages/sessions.
    const panelContent = (
        <DrawerPanelContent
            defaultSize={drawerSize}
            isResizable
            minSize="20rem"
            onResize={onResize}
        >
            <DrawerHead>
                <Title className="pf-u-pb-sm" headingLevel="h3" size="xl">
                    {statusIcon} {selectedTest?.name}
                </Title>
                <DrawerActions>
                    <DrawerCloseButton onClick={onCloseClick} />
                </DrawerActions>
                <Flex
                    spaceItems={{
                        default: 'spaceItemsLg',
                    }}
                >
                    {selectedTest?.isWaivable && (
                        <Button
                            className="pf-u-p-0"
                            icon={<ThumbsUpIcon />}
                            variant="link"
                        >
                            Waive
                        </Button>
                    )}
                    <Button
                        className="pf-u-p-0"
                        icon={<RedoIcon />}
                        variant="link"
                    >
                        Rerun
                    </Button>
                    <Button
                        className="pf-u-p-0"
                        icon={<BookIcon />}
                        variant="link"
                    >
                        Documentation
                    </Button>
                </Flex>
            </DrawerHead>
            <DrawerPanelBody className="pf-u-pb-sm">
                <Alert isInline title="Test information" variant="info">
                    <TextContent>
                        {/* TODO: Replace with real contact info. */}
                        <Text>
                            This test result is provided by the{' '}
                            <b>Kitten Farm</b> team. If you need help with this
                            test, you can reach out to the team via{' '}
                            <b>#kittens on IRC</b>, or via email at{' '}
                            <b>
                                <a href="mailto:kittens@example.com">
                                    kittens@example.com
                                </a>
                            </b>
                            .
                        </Text>
                    </TextContent>
                </Alert>
                {selectedTest?.status === 'error' && (
                    <Alert
                        className="pf-u-mt-md"
                        isInline
                        title="Test not completed"
                        variant="warning"
                    >
                        <TextContent className="pf-u-font-size-sm">
                            {/* TODO: Replace with real error message. */}
                            <Text>
                                This test has failed to complete, but the CI
                                system provided no more information. Please
                                contact the team, listed above, for guidance.
                            </Text>
                        </TextContent>
                    </Alert>
                )}
                {selectedTest?.status === 'failed' && (
                    <Alert
                        className="pf-u-mt-md"
                        isInline
                        title="Test result failed"
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
                {selectedTest?.status === 'waived' && (
                    <Alert
                        className="pf-u-mt-md"
                        customIcon={<HandPaperIcon />}
                        isInline
                        title="Test result waived"
                        variant="default"
                    >
                        <TextContent className="pf-u-font-size-sm">
                            {/* TODO: Replace with real waiver. */}
                            <Text>
                                This test result was waived by <b>mgrabovs</b>{' '}
                                <time
                                    dateTime="2023-01-17T14:39:11Z"
                                    title="2023-01-17T14:39:11Z"
                                >
                                    27 minutes ago
                                </time>{' '}
                                with the following comment:
                            </Text>
                            <Text component="blockquote">
                                <LinkifyNewTab>
                                    This is a broken test. See
                                    https://issues.redhat.com/browse/OSCI-3206
                                </LinkifyNewTab>
                            </Text>
                        </TextContent>
                    </Alert>
                )}
            </DrawerPanelBody>
            <DetailsDrawerTabs
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