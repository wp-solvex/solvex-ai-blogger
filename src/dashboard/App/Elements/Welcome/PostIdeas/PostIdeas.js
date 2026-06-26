import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { Plus, MoveRight, RotateCw, Crown, Edit, WandSparkles } from 'lucide-react';
import { TrimWordsContent } from '@Utils/TrimWordsContent';
import { useDispatch, useSelector } from 'react-redux';
import { updateApiData } from '@Utils/ApiData';
import { useNavigate } from 'react-router-dom';
import Skeleton from './Skeleton';
import apiFetch from '@wordpress/api-fetch';
import ProButton from '@Components/ProButton';
import TokenExhaustionModal from '@Components/TokenExhaustionModal';

const UPDATE_POST_IDEAS = 'UPDATE_POST_IDEAS';
const ADD_CREATED_POST_IDEA = 'ADD_CREATED_POST_IDEA';

export default function PostIdeas() {
	const dispatch = useDispatch();
	const abortControllerRef = useRef( {} );
	const hasFetchedRef = useRef( false );
	const navigate = useNavigate();

	// Fetch data from Redux store using selectors - defaults handled by menu.php
	const siteTitle = useSelector( ( state ) => state.siteTitle );
	const siteFor = useSelector( ( state ) => state.siteFor );
	const siteDescription = useSelector( ( state ) => state.siteDescription );
	const license = useSelector( ( state ) => state.license );
	const postIdeasFromRedux = useSelector( ( state ) => state.postIdeas );
	const licenseStatus = useSelector( ( state ) => state.license_status );
	const proAvailable = useSelector( ( state ) => state.proAvailable );
	const proPurchaseUrl = useSelector( ( state ) => state.proPurchaseUrl );
	const homeSlug = useSelector( ( state ) => state.homeSlug );
	const adminNonce = useSelector( ( state ) => state.adminNonce );
	const ajaxUrl = useSelector( ( state ) => state.ajaxUrl );
	const createdPostIdeasFromRedux = useSelector( ( state ) => state.createdPostIdeas || {} );
	const tokenRemaining = useSelector( ( state ) => state.tokenRemaining );

	const [ postIdeas, setPostIdeas ] = useState( postIdeasFromRedux );
	const [ postIdeasArr, setPostIdeasArr ] = useState( [] );
	const [ loading, setLoading ] = useState( true ); // Always start with loading true
	const [ error, setError ] = useState( null );
	const [ isApiError, setIsApiError ] = useState( false );
	const [ creatingPosts, setCreatingPosts ] = useState( new Set() ); // Track which posts are being created
	const [ showTokenModal, setShowTokenModal ] = useState( false );
	// Use Redux state for createdPosts instead of local component state
	const createdPosts = createdPostIdeasFromRedux;

	const licenseEnabled = licenseStatus === 'licensed';

	const fetchPostIdeas = useCallback( async () => {
		setLoading( true );
		setError( null );
		setIsApiError( false );

		if ( ! siteTitle || ! siteFor || ! siteDescription ) {
			setError( 'Missing required fields' );
			setIsApiError( false ); // Not an API error
			setLoading( false );
			return;
		}

		// Check if license is available - license is always a string
		if ( ! license || typeof license !== 'string' || license.trim() === '' ) {
			setError( 'License key is not available. Please check your license configuration.' );
			setIsApiError( false ); // Not an API error - configuration issue
			setLoading( false );
			return;
		}

		const requestBody = {
			site_title: siteTitle,
			site_purpose: siteFor,
			site_description: siteDescription,
			license: license.trim(),
		};

		try {
			const response = await fetch( 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-post-ideas', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify( requestBody ),
			} );

			if ( ! response.ok ) {
				const errorData = await response.json();
				console.error( 'API Error:', errorData );
				const errorMessage = errorData.message || 'Failed to fetch post ideas.';
				setError( errorMessage );
				setIsApiError( true ); // This is an API error
				setLoading( false );
				return;
			}

			const data = await response.json();

			if ( data && data.post_ideas && Array.isArray( data.post_ideas ) ) {
				// Convert array to string for consistent storage
				const postIdeasString = data.post_ideas.filter( ( idea ) => idea && typeof idea === 'string' && idea.trim() ).join( '\n' );

				// Store as string in Redux and DB
				dispatch( {
					type: UPDATE_POST_IDEAS,
					payload: postIdeasString,
				} );
				await updateApiData( 'postIdeas', postIdeasString, dispatch, abortControllerRef );
				setPostIdeas( postIdeasString );

				// Handle token data if present
				if ( data.token_data ) {
					// Update Redux store with token data
					dispatch( {
						type: 'UPDATE_TOKEN_TOTAL',
						payload: data.token_data.total,
					} );
					dispatch( {
						type: 'UPDATE_TOKEN_REMAINING',
						payload: data.token_data.remaining,
					} );

					// Update API data in database
					await updateApiData( 'tokenTotal', data.token_data.total, dispatch, abortControllerRef );
					await updateApiData( 'tokenRemaining', data.token_data.remaining, dispatch, abortControllerRef );
				}

				setLoading( false );
			} else {
				console.error( 'API Error: Invalid response from API' );
				setError( 'Invalid response from API.' );
				setIsApiError( true ); // This is an API error
				setLoading( false );
			}
		} catch ( err ) {
			console.error( 'API Error:', err );
			setError( err.message );
			setIsApiError( true ); // This is an API error
			setLoading( false );
		}
	}, [
		siteTitle,
		siteFor,
		siteDescription,
		license,
		dispatch,
	] );

	useEffect( () => {
		// If license is not enabled, don't do anything
		if ( ! licenseEnabled ) {
			setLoading( false );
			return;
		}

		// If we already have post ideas from Redux/DB, use them and don't fetch
		if ( postIdeasFromRedux && typeof postIdeasFromRedux === 'string' && postIdeasFromRedux.trim() !== '' ) {
			setPostIdeas( postIdeasFromRedux );
			setLoading( false );
			return;
		}

		// Only fetch if we don't have post ideas and haven't already tried to fetch
		if ( ! hasFetchedRef.current ) {
			hasFetchedRef.current = true;
			// Keep loading true while we fetch
			setLoading( true );
			fetchPostIdeas();
		} else {
			// We've already tried fetching but have no data, so stop loading
			setLoading( false );
		}
	}, [ licenseEnabled, postIdeasFromRedux, fetchPostIdeas ] );

	useEffect( () => {
		// Convert string to array for display when postIdeas changes
		if ( licenseEnabled && postIdeas && typeof postIdeas === 'string' && postIdeas.trim() !== '' && postIdeas !== '-1' ) {
			// Convert string to array by splitting on newlines
			const ideasArray = postIdeas.split( '\n' ).filter( ( idea ) => idea.trim() !== '' );
			setPostIdeasArr( ideasArray );
		} else {
			// Clear the array if no post ideas
			setPostIdeasArr( [] );
		}
	}, [ postIdeas, licenseEnabled ] );

	const handleRefresh = useCallback( ( e ) => {
		// This function should only be called when pro is available
		if ( ! proAvailable ) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		// Pre-check: insufficient tokens.
		if ( tokenRemaining !== undefined && tokenRemaining < 1500 ) {
			setShowTokenModal( true );
			return;
		}

		dispatch( {
			type: UPDATE_POST_IDEAS,
			payload: '', // Use empty string instead of empty array
		} );
		setPostIdeas( '' );
		setLoading( true );
		setError( null );
		setIsApiError( false );
		hasFetchedRef.current = false; // Reset the fetch flag to allow refetch
		fetchPostIdeas();
	}, [ proAvailable, dispatch, fetchPostIdeas, tokenRemaining ] );

	if ( ! licenseEnabled ) {
		return ( '' );
	}

	// Remove the separate loading return - we'll handle it inline

	const handlePersonaClick = ( event ) => {
		event.preventDefault(); // Prevent the default link behavior
		navigate( `?page=${ homeSlug }&path=settings` ); // Navigate to the settings tab.
	};

	if ( error ) {
		// Check for insufficient tokens error
		if ( error === 'Token exhausted: Insufficient tokens for this request.' ) {
			return (
				<div className="p-4 text-red-500 flex flex-col items-center">
					<p> { __( 'Error while loading post ideas:', 'solvex-ai-blogger' ) } { error } </p>
					<ProButton
						url="https://wpaiblogger.com/pricing/"
						variant="primary"
						size="default"
						icon={ <MoveRight className="h-5 w-5" /> }
						className="mt-5"
					>
						{ __( 'Upgrade Now', 'solvex-ai-blogger' ) }
					</ProButton>
				</div>
			);
		}

		if ( error === 'Missing required fields' ) {
			const title = __( 'Please fill out the general settings to see post ideas.', 'solvex-ai-blogger' );
			const buttonText = __( 'Go to General Settings', 'solvex-ai-blogger' );

			return (
				<div className="p-4 text-red-500 flex flex-col items-center">
					<p> { title } </p>
					<a
						href="#"
						onClick={ handlePersonaClick }
						className="cursor-pointer inline-flex justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 mt-5 gap-1"
						style={ { color: 'white' } } // Inline style to ensure white color.
					>
						{ buttonText }
						<MoveRight className="h-5 w-5" />
					</a>
				</div>
			);
		}

		if ( error === 'License key is not available. Please check your license configuration.' ) {
			const title = __( 'Connect your free account to use this feature.', 'solvex-ai-blogger' );
			const buttonText = __( 'Connect Account', 'solvex-ai-blogger' );

			return (
				<div className="p-4 text-red-500 flex flex-col items-center">
					<p> { title } </p>
					<a
						href="#"
						onClick={ ( event ) => {
							event.preventDefault();
							navigate( `?page=${ homeSlug }&path=settings&tab=license` );
						} }
						className="cursor-pointer inline-flex justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 mt-5 gap-1"
						style={ { color: 'white' } } // Inline style to ensure white color.
					>
						{ buttonText }
						<MoveRight className="h-5 w-5" />
					</a>
				</div>
			);
		}

		return (
			<div className="p-4 text-red-500 flex flex-col items-center">
				<p> { __( 'Error while loading post ideas:', 'solvex-ai-blogger' ) } { error } </p>
				{ isApiError && (
					<button
						onClick={ handleRefresh }
						className="mt-4 flex items-center gap-2 bg-brand-600 text-white rounded px-4 py-2 hover:bg-brand-500"
					>
						<RotateCw className="h-4 w-4" />
						{ __( 'Retry', 'solvex-ai-blogger' ) }
					</button>
				) }
			</div>
		);
	}

	const wpsolvex_autoaiblogger_create_post = ( e, title ) => {
		e.preventDefault();

		if ( e.target.dataset.type === 'open-post' ) {
			window.open( e.target.href, '_blank' );
			return;
		}

		// Pre-check: insufficient tokens.
		if ( tokenRemaining !== undefined && tokenRemaining < 1500 ) {
			setShowTokenModal( true );
			return;
		}

		// Prevent multiple clicks for the same post OR if any post is being created
		if ( creatingPosts.has( title ) || creatingPosts.size > 0 ) {
			return;
		}

		// Add this post to the creating set
		setCreatingPosts( ( prev ) => new Set( prev ).add( title ) );

		const formData = new window.FormData();
		formData.append( 'action', 'wpsolvex_autoaiblogger_create_post' );
		formData.append( 'security', adminNonce );

		const postData = {
			title,
			status: 'draft',
			post_type: 'post',
			post_content: '',
			excerpt: '',
			metadata: JSON.stringify( { wpsolvex_autoaiblogger_reference: 1 } ),
			// Include license and site information for content generation
			license,
			site_title: siteTitle,
			site_purpose: siteFor,
			site_description: siteDescription,
			image_count: 2,
		};

		formData.append( 'post_data', JSON.stringify( postData ) );

		return apiFetch( {
			url: ajaxUrl,
			method: 'POST',
			body: formData,
		} )
			.then( async ( response ) => {
				// Check if response exists and has the expected structure
				if ( ! response || typeof response !== 'object' ) {
					console.error( __( 'Invalid response received from server.', 'solvex-ai-blogger' ) );
					dispatch( {
						type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
						payload: {
							message: __( 'Error: Invalid response from server.', 'solvex-ai-blogger' ),
							type: 'error',
							duration: 5000,
						},
					} );
					return;
				}

				// Check if the request was successful
				if ( ! response.success ) {
					const errorMessage = response.data?.message || __( 'Failed to create post.', 'solvex-ai-blogger' );
					const details = response.data?.details || null;
					console.error( __( 'Failed to create post:', 'solvex-ai-blogger' ), errorMessage );

					// Update token data even on errors to keep UI in sync.
					if ( response.data?.token_data &&
						typeof response.data.token_data === 'object' &&
						response.data.token_data.total !== undefined &&
						response.data.token_data.remaining !== undefined ) {
						dispatch( {
							type: 'UPDATE_TOKEN_TOTAL',
							payload: response.data.token_data.total,
						} );
						dispatch( {
							type: 'UPDATE_TOKEN_REMAINING',
							payload: response.data.token_data.remaining,
						} );
					}

					dispatch( {
						type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
						payload: {
							title: details?.title || __( "Couldn't generate this post", 'solvex-ai-blogger' ),
							message: details?.user_message || errorMessage,
							type: 'error',
							duration: 8000,
							details: details || {
								error_code: response.data?.code,
								http_status: response.data?.status,
								detail: errorMessage,
								user_message: errorMessage,
							},
						},
					} );
					return;
				}

				// Validate that we have the required data
				if ( ! response.data || ! response.data.post_id || ! response.data.edit_link ) {
					console.error( __( 'Post created but no post ID or edit link received.', 'solvex-ai-blogger' ) );
					dispatch( {
						type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
						payload: {
							message: __( 'Error: Post created but unable to get post details.', 'solvex-ai-blogger' ),
							type: 'error',
							duration: 5000,
						},
					} );
					return;
				}

				// Use the edit link provided by the backend
				const editUrl = response.data.edit_link;

				// Store the created post information in Redux
				dispatch( {
					type: ADD_CREATED_POST_IDEA,
					payload: {
						title,
						editUrl,
					},
				} );

				// Persist to database (non-blocking - don't fail if this errors)
				const updatedCreatedPosts = {
					...createdPosts,
					[ title ]: editUrl,
				};

				// Try to persist but don't let it fail the success flow
				try {
					await updateApiData( 'createdPostIdeas', JSON.stringify( updatedCreatedPosts ), dispatch, abortControllerRef );
				} catch ( persistError ) {
					// Log the error but don't show it to the user since the post was created successfully
					console.warn( 'Failed to persist created post idea to database:', persistError.message );
					// The Redux state is already updated, so the UI will still work correctly
				}

				// Handle token data if present (update Redux state only, database already updated)
				if ( response.data.token_data &&
					typeof response.data.token_data === 'object' &&
					response.data.token_data.total !== undefined &&
					response.data.token_data.remaining !== undefined ) {
					dispatch( {
						type: 'UPDATE_TOKEN_TOTAL',
						payload: response.data.token_data.total,
					} );
					dispatch( {
						type: 'UPDATE_TOKEN_REMAINING',
						payload: response.data.token_data.remaining,
					} );

					// Try to update API data in database (non-blocking)
					try {
						await updateApiData( 'tokenTotal', response.data.token_data.total, dispatch, abortControllerRef );
						await updateApiData( 'tokenRemaining', response.data.token_data.remaining, dispatch, abortControllerRef );
					} catch ( tokenPersistError ) {
						// Log the error but don't show it to the user
						console.warn( 'Failed to persist token data to database:', tokenPersistError.message );
						// Redux state is already updated, so the UI will show correct values
					}
				}

				dispatch( {
					type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
					payload: {
						message: __( 'Post created successfully!', 'solvex-ai-blogger' ),
						type: 'success',
						duration: 6000,
						link: {
							url: editUrl,
							label: __( 'View post', 'solvex-ai-blogger' ),
						},
					},
				} );
			} )
			.catch( ( newError ) => {
				// Handle network errors or other exceptions
				const errorMessage = newError?.message || __( 'Network error occurred while creating post.', 'solvex-ai-blogger' );
				const details = newError?.details || null;
				console.error( __( 'Error creating post:', 'solvex-ai-blogger' ), newError );
				dispatch( {
					type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
					payload: {
						title: details?.title || __( 'Service temporarily unavailable', 'solvex-ai-blogger' ),
						message: details?.user_message || __( 'Our service is temporarily unavailable. Please try again after some time.', 'solvex-ai-blogger' ),
						type: 'error',
						duration: 8000,
						details: details || {
							error_code: newError?.code || 'network_error',
							http_status: newError?.data?.status,
							category: 'temporary',
							detail: errorMessage,
							user_message: errorMessage,
						},
					},
				} );
				// Reset button state
			} )
			.finally( () => {
				// Remove this post from the creating set
				setCreatingPosts( ( prev ) => {
					const newSet = new Set( prev );
					newSet.delete( title );
					return newSet;
				} );
			} );
	};

	return (
		<>
		<div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8" data-tour-target="post-ideas">
			<div className="sm:flex sm:items-center sm:justify-between">
				<div className="flex flex-col gap-2">
					<h2 className="text-xl font-semibold text-gray-900 flex items-center gap-4 p-0 m-0">
						{ __( 'Blog Post Suggestions', 'solvex-ai-blogger' ) }
					</h2>

					<p className="mt-4 text-sm text-gray-700">
						{ __( 'A list of some new blog post ideas that you can use to grow your blog.', 'solvex-ai-blogger' ) }
					</p>
				</div>

				<div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-2">
					<ProButton
						variant="primary"
						size="default"
						icon={ proAvailable ? <WandSparkles className="w-4 h-4" /> : <Crown className="w-4 h-4" /> }
						url={ proAvailable ? '' : proPurchaseUrl } // Only provide URL when pro is not available
						onClick={ proAvailable ? handleRefresh : null } // Only provide onClick when pro is available
						tooltip={ proAvailable ? __( 'Refresh Post Ideas', 'solvex-ai-blogger' ) : __( '⚡ Limited to 5 Suggestions, Upgrade to Pro', 'solvex-ai-blogger' ) }
						tooltipPosition="left"
						iconPosition="left"
					>
						{ proAvailable ? __( 'Refresh', 'solvex-ai-blogger' )
							: ( postIdeasFromRedux === '-1'
								? __( 'Refresh (0/5)', 'solvex-ai-blogger' )
								: ( ! postIdeasFromRedux || postIdeasFromRedux.trim() === ''
									? __( 'Refresh', 'solvex-ai-blogger' )
									: `${ __( 'Refresh', 'solvex-ai-blogger' ) } (${ Math.min( postIdeasArr.length, 5 ) }/5)`
								)
							)
						}
					</ProButton>
				</div>
			</div>

			<div className="mt-6 flow-root">
				<div className="overflow-hidden shadow ring-1 ring-black/5 rounded-lg">
					{ /* Header row */ }
					<div className="flex bg-gradient-to-r from-brand-50 to-indigo-50 border-b border-gray-300">
						<div className="w-3/5 py-3.5 pl-4 pr-3 sm:pl-6 text-left text-sm font-semibold text-gray-900">
							{ __( 'Title', 'solvex-ai-blogger' ) }
						</div>
						<div className="w-2/5 px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
							{ __( 'Write Post', 'solvex-ai-blogger' ) }
						</div>
					</div>

					{ /* Body */ }
					<div className="divide-y divide-gray-200 bg-white">
						{ loading ? (
							// Show skeleton loader
							<Suspense fallback={
								<div className="px-6 py-4 text-center text-gray-500">
									{ __( 'Loading…', 'solvex-ai-blogger' ) }
								</div>
							}>
								<Skeleton />
							</Suspense>
						) : postIdeasFromRedux === '-1' ? (
							// Special case for when postIdeasFromRedux is "-1"
							<div className="px-6 py-4 text-center text-amber-600 font-medium">
								{ __( '🚀 Need more ideas? Go Pro for unlimited suggestions', 'solvex-ai-blogger' ) }
							</div>
						) : postIdeasArr && Array.isArray( postIdeasArr ) && postIdeasArr.length > 0 ? (
							<>
								{ /* Limit to 5 ideas for free users, unlimited for pro users */ }
								{ postIdeasArr.slice( 0, proAvailable ? postIdeasArr.length : 5 ).map( ( postTitle, index ) => (
									<div
										key={ `post-idea-${ index }-${ postTitle?.slice( 0, 20 ) || index }` }
										className={ `flex items-stretch ${ index % 2 === 1 ? 'bg-gray-50' : '' }` }
									>
										<div className="w-3/5 min-w-0 overflow-hidden py-4 pl-4 pr-3 sm:pl-6 text-sm text-gray-900 font-normal break-words">
											<TrimWordsContent
												content={ postTitle || '' }
												count={ 120 }
											/>
										</div>
										<div className="w-2/5 flex-shrink-0 relative z-10 flex items-center justify-end pl-3 pr-4 sm:pr-6 text-sm text-right">
											{ createdPosts[ postTitle ] ? (
												// Show "Open Post" for created posts
												<a
													target="_blank"
													href={ createdPosts[ postTitle ] }
													className="relative z-20 inline-flex items-center gap-x-1 cursor-pointer font-semibold py-4"
													style={ { color: 'rgb(22, 163, 74)' } }
													onClick={ ( e ) => {
														// Let the default link behavior handle opening the post
														e.stopPropagation();
													} } rel="noreferrer"
												>
													<Edit className="w-5 h-5 flex-shrink-0" />
													{ __( 'Edit', 'solvex-ai-blogger' ) }
												</a>
											) : (
												// Show "Create" or loading state
												<a
													target="_blank"
													href="#"
													onClick={ ( e ) => wpsolvex_autoaiblogger_create_post( e, postTitle || '' ) }
													className={ `relative z-20 inline-flex items-center gap-x-1 cursor-pointer py-4 ${
														creatingPosts.size > 0
															? ( creatingPosts.has( postTitle )
																? ''
																: 'text-gray-400 cursor-not-allowed' )
															: 'text-brand-600 hover:text-brand-900'
													}` }
													data-type="create"
													style={ {
														pointerEvents: creatingPosts.size > 0 && ! creatingPosts.has( postTitle ) ? 'none' : 'auto',
														...( creatingPosts.has( postTitle ) && { color: 'rgb(22, 163, 74)' } ),
													} }
												>
													{ creatingPosts.has( postTitle ) ? (
														// Show loading state for the current post being created
														<>
															<svg className="animate-spin h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={ { filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))', backdropFilter: 'blur(4px)' } }>
																<circle className="opacity-30" cx="12" cy="12" r="10" stroke="rgb(34, 197, 94)" strokeWidth="3"></circle>
																<path className="opacity-90" fill="rgb(34, 197, 94)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
															</svg>
															{ __( 'Creating…', 'solvex-ai-blogger' ) }
														</>
													) : (
														// Show normal or disabled state
														<>
															<Plus className="w-5 h-5 flex-shrink-0" />
															{ __( 'Create', 'solvex-ai-blogger' ) }
														</>
													) }
												</a>
											) }
										</div>
									</div>
								) ) }

								{ /* Show upgrade prompt for free users when there are more than 5 ideas */ }
								{ ! proAvailable && postIdeasArr.length > 5 && (
									<div className="bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-amber-200 px-6 py-6 text-center">
										<div className="flex flex-col items-center space-y-3">
											<div className="text-amber-700 font-semibold text-sm">
												🔒 { `${ postIdeasArr.length - 5 } ${ __( 'more post ideas available with Pro!', 'solvex-ai-blogger' ) }` }
											</div>
											<ProButton
												url={ proPurchaseUrl }
												variant="primary"
												size="small"
												icon={ <MoveRight className="w-4 h-4" /> }
											>
												{ __( 'Unlock All Ideas - Upgrade Now', 'solvex-ai-blogger' ) }
											</ProButton>
										</div>
									</div>
								) }
							</>
						) : (
							<div className="px-6 py-4 text-center text-gray-500">
								{ __( 'No post ideas available.', 'solvex-ai-blogger' ) }
							</div>
						) }
					</div>

					{ /* Footer */ }
					{ ! proAvailable ? (
						<div className="bg-gray-50 px-3 py-3.5 text-center text-sm font-semibold">
							<div className="flex flex-col items-center space-y-2">
								<ProButton
									url={ proPurchaseUrl }
									variant="primary"
									size="default"
									icon={ <MoveRight className="w-5 h-5" /> }
								>
									{ __( 'Upgrade to Pro', 'solvex-ai-blogger' ) }
								</ProButton>
							</div>
						</div>
					) : null }
				</div>
			</div>
		</div>

		<TokenExhaustionModal
			isOpen={ showTokenModal }
			onClose={ () => setShowTokenModal( false ) }
		/>
		</>
	);
}
