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
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
    HttpLink,
    ApolloLink,
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
/**
 * It's strongly advised to use the PatternFly Base CSS in your whole project, or some components may diverge in appearance.
 */
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/react-styles/css/utilities/Sizing/sizing.css';
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css';
import '@patternfly/react-styles/css/utilities/Text/text.css';

import { config } from '../config';
import { menuRoutes, otherRoutes } from '../routes';

/**
 * By default GraphQL for query doesn't attach existing cookies.
 * GraphQL attaches cookies to query.
 * need to instruct GragphQL to send existing cookies along with each single request.
 */
const httpLink = new HttpLink({
    uri: config.graphQlServerUrl,
    /**
     * You a making request to the same url that browser is currently on. This will add existing cookies to requests!
     */
    credentials: 'same-origin',
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) =>
            console.log(
                `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
                    locations,
                )}, Path: ${path}`,
            ),
        );
    if (networkError) console.log(`[Network error]: ${networkError}`);
});

const client = new ApolloClient({
    /**
     * Data ID from Object. Purpose identify each record that comes.
     * from server. "I just got updated record ABC."
     * Every record we fetch from backedn we be run through this function:
     */
    link: ApolloLink.from([errorLink, httpLink]),
    cache: new InMemoryCache({
        typePolicies: {
            /**
             * https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-arrays-of-non-normalized-objects
             * https://www.apollographql.com/docs/react/caching/cache-configuration/#generating-unique-identifiers
             * Not all states have msg_id. Todo: find why.
             * StateType: {
             *     // In most inventory management systems, a single UPC code uniquely
             *     // identifies any product.
             *     keyFields: ['msg_id'],
             * },
             */
        },
    }),
    connectToDevTools: true,
    /**
     * dataIdFromObject: (o) => o.id,
     */
});

export function App() {
    const contentRoutes = menuRoutes
        .concat(otherRoutes)
        .filter((item) => item.element)
        .map((item) => (
            <Route
                element={item.element}
                key={item.key}
                path={item.route || item.path}
            />
        ));

    return (
        <ApolloProvider client={client}>
            <div className="pf-u-h-100vh">
                <HashRouter>
                    <Routes>
                        <Route
                            path="/"
                            element={<Navigate replace to="/search" />}
                        />
                        {contentRoutes}
                    </Routes>
                </HashRouter>
            </div>
        </ApolloProvider>
    );
}
