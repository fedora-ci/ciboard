/*
 * This file is part of ciboard
 *
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
import { useEffect, useRef } from 'react';

/**
 * Hook for working with page title, specifically, the document.title property.
 * This implementation is based on an MIT-licensed implementation by Amit Solanki
 * and Michał Miszczyszyn.
 * Original code available at https://github.com/rehooks/document-title
 */
export function useTitle(title: string): void {
    // Save the page title before we change it as we might need it later.
    const titleRef = useRef(document.title);

    useEffect(() => {
        document.title = title;
    }, [title]);

    useEffect(() => {
        const previousTitle = titleRef.current;
        return () => {
            // Restore the title once the component is unmounted.
            document.title = previousTitle;
        };
    }, []);
}
