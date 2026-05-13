import React, { useState, useEffect, useRef, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiFetch from '@wordpress/api-fetch';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit from 'lucide-react/dist/esm/icons/edit';
import MoveRight from 'lucide-react/dist/esm/icons/move-right';
import Crown from 'lucide-react/dist/esm/icons/crown';
import RotateCw from 'lucide-react/dist/esm/icons/rotate-cw';
import WandSparkles from 'lucide-react/dist/esm/icons/wand-sparkles';
import { TrimWordsContent } from '@Utils/TrimWordsContent';
import { updateApiData } from '@Utils/ApiData';
import { cn } from '@Utils/cn';
import { toast } from '@Utils/toast';
import Skeleton from './Skeleton';
import ProButton from '@Components/ProButton';

const UPDATE_POST_IDEAS = 'UPDATE_POST_IDEAS';
const ADD_CREATED_POST_IDEA = 'ADD_CREATED_POST_IDEA';

function ErrorCard( { children } ) {
	return (
		<div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
			{ children }
		</div>
	);
}

function PostIdeas() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const abortControllerRef = useRef( {} );
	const hasFetchedRef = useRef( false );

	const siteTitle = useSelector( ( s ) => s.siteTitle );
	const siteFor = useSelector( ( s ) => s.siteFor );
	const siteDescription = useSelector( ( s ) => s.siteDescription );
	const temperature = useSelector( ( s ) => s.temperature );
	const harassment = useSelector( ( s ) => s.harassment );
	const hate = useSelector( ( s ) => s.hate );
	const sexuallyExplicit = useSelector( ( s ) => s.sexuallyExplicit );
	const dangerousContent = useSelector( ( s ) => s.dangerousContent );
	const license = useSelector( ( s ) => s.license );
	const postIdeasFromRedux = useSelector( ( s ) => s.postIdeas );
	const licenseStatus = useSelector( ( s ) => s.license_status );
	const proAvailable = useSelector( ( s ) => s.proAvailable );
	const proPurchaseUrl = useSelector( ( s ) => s.proPurchaseUrl );
	const homeSlug = useSelector( ( s ) => s.homeSlug );
	const adminNonce = useSelector( ( s ) => s.adminNonce );
	const ajaxUrl = useSelector( ( s ) => s.ajaxUrl );
	const createdPosts = useSelector( ( s ) => s.createdPostIdeas || {} );

	const [ postIdeas, setPostIdeas ] = useState( postIdeasFromRedux );
	const [ postIdeasArr, setPostIdeasArr ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ isApiError, setIsApiError ] = useState( false );
	const [ creatingPosts, setCreatingPosts ] = useState( new Set() );

	const licenseEnabled = licenseStatus === 'licensed';

	const fetchPostIdeas = useCallback( async () => {
		setLoading( true );
		setError( null );
		setIsApiError( false );

		if ( ! siteTitle || ! siteFor || ! siteDescription ) {
			setError( 'Missing required fields' );
			setLoading( false );
			return;
		}
		if ( ! license || typeof license !== 'string' || license.trim() === '' ) {
			setError( 'License key is not available. Please check your license configuration.' );
			setLoading( false );
			return;
		}

		try {
			const response = await fetch( 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-post-ideas', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( {
					site_title: siteTitle,
					site_purpose: siteFor,
					site_description: siteDescription,
					temperature,
					harassment,
					hate,
					sexually_explicit: sexuallyExplicit,
					dangerous_content: dangerousContent,
					license: license.trim(),
				} ),
			} );

			if ( ! response.ok ) {
				const errData = await response.json();
				setError( errData.message || 'Failed to fetch post ideas.' );
				setIsApiError( true );
				setLoading( false );
				return;
			}

			const data = await response.json();
			if ( data && data.post_ideas && Array.isArray( data.post_ideas ) ) {
				const ideasString = data.post_ideas
					.filter( ( i ) => i && typeof i === 'string' && i.trim() )
					.join( '\n' );
				dispatch( { type: UPDATE_POST_IDEAS, payload: ideasString } );
				await updateApiData( 'postIdeas', ideasString, dispatch, abortControllerRef );
				setPostIdeas( ideasString );

				if ( data.token_data ) {
					dispatch( { type: 'UPDATE_TOKEN_TOTAL', payload: data.token_data.total } );
					dispatch( { type: 'UPDATE_TOKEN_REMAINING', payload: data.token_data.remaining } );
					await updateApiData( 'tokenTotal', data.token_data.total, dispatch, abortControllerRef );
					await updateApiData( 'tokenRemaining', data.token_data.remaining, dispatch, abortControllerRef );
				}
				setLoading( false );
			} else {
				setError( 'Invalid response from API.' );
				setIsApiError( true );
				setLoading( false );
			}
		} catch ( err ) {
			setError( err.message );
			setIsApiError( true );
			setLoading( false );
		}
	}, [
		siteTitle,
		siteFor,
		siteDescription,
		temperature,
		harassment,
		hate,
		sexuallyExplicit,
		dangerousContent,
		license,
		dispatch,
	] );

	useEffect( () => {
		if ( ! licenseEnabled ) {
			setLoading( false );
			return;
		}
		if ( postIdeasFromRedux && typeof postIdeasFromRedux === 'string' && postIdeasFromRedux.trim() !== '' ) {
			setPostIdeas( postIdeasFromRedux );
			setLoading( false );
			return;
		}
		if ( ! hasFetchedRef.current ) {
			hasFetchedRef.current = true;
			setLoading( true );
			fetchPostIdeas();
		} else {
			setLoading( false );
		}
	}, [ licenseEnabled, postIdeasFromRedux, fetchPostIdeas ] );

	useEffect( () => {
		if ( licenseEnabled && postIdeas && typeof postIdeas === 'string' && postIdeas.trim() !== '' && postIdeas !== '-1' ) {
			setPostIdeasArr( postIdeas.split( '\n' ).filter( ( i ) => i.trim() !== '' ) );
		} else {
			setPostIdeasArr( [] );
		}
	}, [ postIdeas, licenseEnabled ] );

	const handleRefresh = useCallback( ( e ) => {
		if ( ! proAvailable ) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		dispatch( { type: UPDATE_POST_IDEAS, payload: '' } );
		setPostIdeas( '' );
		setLoading( true );
		setError( null );
		setIsApiError( false );
		hasFetchedRef.current = false;
		fetchPostIdeas();
	}, [ proAvailable, dispatch, fetchPostIdeas ] );

	const createPost = useCallback( ( title ) => {
		if ( creatingPosts.has( title ) || creatingPosts.size > 0 ) {
			return;
		}

		setCreatingPosts( ( prev ) => new Set( prev ).add( title ) );

		const formData = new window.FormData();
		formData.append( 'action', 'wpsolvex_autoaiblogger_create_post' );
		formData.append( 'security', adminNonce );
		formData.append(
			'post_data',
			JSON.stringify( {
				title,
				status: 'draft',
				post_type: 'post',
				post_content: '',
				excerpt: '',
				metadata: JSON.stringify( { wpsolvex_autoaiblogger_reference: 1 } ),
				license,
				site_title: siteTitle,
				site_purpose: siteFor,
				site_description: siteDescription,
				temperature,
				harassment,
				hate,
				sexually_explicit: sexuallyExplicit,
				dangerous_content: dangerousContent,
				image_count: 2,
			} )
		);

		apiFetch( { url: ajaxUrl, method: 'POST', body: formData } )
			.then( async ( response ) => {
				if ( ! response || typeof response !== 'object' ) {
					toast.error( __( 'Error: Invalid response from server.', 'solvex-ai-blogger' ) );
					return;
				}
				if ( ! response.success ) {
					const message = response.data?.message || __( 'Failed to create post.', 'solvex-ai-blogger' );
					toast.error( `${ __( 'Error: ', 'solvex-ai-blogger' ) }${ message }` );
					return;
				}
				if ( ! response.data?.post_id || ! response.data?.edit_link ) {
					toast.error( __( 'Error: Post created but unable to get post details.', 'solvex-ai-blogger' ) );
					return;
				}

				const editUrl = response.data.edit_link;
				dispatch( { type: ADD_CREATED_POST_IDEA, payload: { title, editUrl } } );

				try {
					await updateApiData(
						'createdPostIdeas',
						JSON.stringify( { ...createdPosts, [ title ]: editUrl } ),
						dispatch,
						abortControllerRef
					);
				} catch ( persistError ) {
					console.warn( 'Failed to persist created post idea:', persistError.message );
				}

				if ( response.data.token_data?.total !== undefined && response.data.token_data?.remaining !== undefined ) {
					dispatch( { type: 'UPDATE_TOKEN_TOTAL', payload: response.data.token_data.total } );
					dispatch( { type: 'UPDATE_TOKEN_REMAINING', payload: response.data.token_data.remaining } );
					try {
						await updateApiData( 'tokenTotal', response.data.token_data.total, dispatch, abortControllerRef );
						await updateApiData( 'tokenRemaining', response.data.token_data.remaining, dispatch, abortControllerRef );
					} catch ( e ) {
						console.warn( 'Failed to persist token data:', e.message );
					}
				}

				toast.success( __( 'Post created. Click "Edit" to open it.', 'solvex-ai-blogger' ) );
			} )
			.catch( ( err ) => {
				toast.error( `${ __( 'Error: ', 'solvex-ai-blogger' ) }${ err?.message || __( 'Network error.', 'solvex-ai-blogger' ) }` );
			} )
			.finally( () => {
				setCreatingPosts( ( prev ) => {
					const next = new Set( prev );
					next.delete( title );
					return next;
				} );
			} );
	}, [ adminNonce, ajaxUrl, license, siteTitle, siteFor, siteDescription, temperature, harassment, hate, sexuallyExplicit, dangerousContent, dispatch, creatingPosts, createdPosts ] );

	const goToSettings = useCallback( ( e ) => {
		e.preventDefault();
		navigate( `?page=${ homeSlug }&path=settings` );
	}, [ navigate, homeSlug ] );

	const goToLicense = useCallback( ( e ) => {
		e.preventDefault();
		navigate( `?page=${ homeSlug }&path=settings/license` );
	}, [ navigate, homeSlug ] );

	if ( ! licenseEnabled ) {
		return null;
	}

	if ( error ) {
		if ( error === 'Token exhausted: Insufficient tokens for this request.' ) {
			return (
				<ErrorCard>
					<p className="text-sm text-destructive">
						{ __( 'Insufficient tokens to load more ideas.', 'solvex-ai-blogger' ) }
					</p>
					<ProButton
						url="https://wpaiblogger.com/pricing/"
						variant="primary"
						size="default"
						icon={ <MoveRight className="h-4 w-4" /> }
						className="mt-4"
					>
						{ __( 'Upgrade Now', 'solvex-ai-blogger' ) }
					</ProButton>
				</ErrorCard>
			);
		}
		if ( error === 'Missing required fields' ) {
			return (
				<ErrorCard>
					<p className="text-sm text-destructive">
						{ __( 'Fill in your site’s general settings to see post ideas.', 'solvex-ai-blogger' ) }
					</p>
					<button
						type="button"
						onClick={ goToSettings }
						className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
					>
						{ __( 'Go to General Settings', 'solvex-ai-blogger' ) }
						<MoveRight className="h-4 w-4" aria-hidden="true" />
					</button>
				</ErrorCard>
			);
		}
		if ( error === 'License key is not available. Please check your license configuration.' ) {
			return (
				<ErrorCard>
					<p className="text-sm text-destructive">
						{ __( 'License key is missing. Activate your license to use this feature.', 'solvex-ai-blogger' ) }
					</p>
					<button
						type="button"
						onClick={ goToLicense }
						className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
					>
						{ __( 'Go to License Settings', 'solvex-ai-blogger' ) }
						<MoveRight className="h-4 w-4" aria-hidden="true" />
					</button>
				</ErrorCard>
			);
		}
		return (
			<ErrorCard>
				<p className="text-sm text-destructive">
					{ __( 'Error while loading post ideas:', 'solvex-ai-blogger' ) } { error }
				</p>
				{ isApiError && (
					<button
						type="button"
						onClick={ handleRefresh }
						className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
					>
						<RotateCw className="h-4 w-4" aria-hidden="true" />
						{ __( 'Retry', 'solvex-ai-blogger' ) }
					</button>
				) }
			</ErrorCard>
		);
	}

	const displayedIdeas = postIdeasArr.slice( 0, proAvailable ? postIdeasArr.length : 5 );
	const hasIdeas = displayedIdeas.length > 0;
	const refreshLabel = proAvailable
		? __( 'Refresh', 'solvex-ai-blogger' )
		: postIdeasFromRedux === '-1'
			? __( 'Refresh (0/5)', 'solvex-ai-blogger' )
			: ! postIdeasFromRedux || postIdeasFromRedux.trim() === ''
				? __( 'Refresh', 'solvex-ai-blogger' )
				: `${ __( 'Refresh', 'solvex-ai-blogger' ) } (${ Math.min( postIdeasArr.length, 5 ) }/5)`;

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-black/[0.02]">
			<header className="flex items-end justify-between border-b border-border px-6 py-5">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">
						{ __( 'Blog Post Suggestions', 'solvex-ai-blogger' ) }
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'AI-ranked topics to grow your blog.', 'solvex-ai-blogger' ) }
					</p>
				</div>
				{ proAvailable ? (
					<button
						type="button"
						onClick={ handleRefresh }
						className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand/30"
						title={ __( 'Refresh post ideas', 'solvex-ai-blogger' ) }
					>
						<WandSparkles className="size-3" aria-hidden="true" />
						{ refreshLabel }
					</button>
				) : (
					<ProButton
						variant="primary"
						size="default"
						icon={ <Crown className="h-4 w-4" /> }
						url={ proPurchaseUrl }
						tooltip={ __( 'Limited to 5 suggestions — Upgrade to Pro', 'solvex-ai-blogger' ) }
						tooltipPosition="left"
						iconPosition="left"
					>
						{ refreshLabel }
					</ProButton>
				) }
			</header>

			<div>
				<div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border bg-muted/40 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
					<span>{ __( 'Title', 'solvex-ai-blogger' ) }</span>
					<span>{ __( 'Write Post', 'solvex-ai-blogger' ) }</span>
				</div>

				{ loading ? (
					<Skeleton rows={ 5 } />
				) : postIdeasFromRedux === '-1' ? (
					<div className="px-6 py-10 text-center text-sm font-medium text-muted-foreground">
						{ __( 'Need more ideas? Go Pro for unlimited suggestions.', 'solvex-ai-blogger' ) }
					</div>
				) : ! hasIdeas ? (
					<div className="px-6 py-10 text-center text-sm text-muted-foreground">
						{ __( 'No post ideas available.', 'solvex-ai-blogger' ) }
					</div>
				) : (
					<ul className="divide-y divide-border">
						{ displayedIdeas.map( ( postTitle, index ) => {
							const isCreated = Boolean( createdPosts[ postTitle ] );
							const isCreating = creatingPosts.has( postTitle );
							const isDisabled = creatingPosts.size > 0 && ! isCreating;
							return (
								<li
									key={ `idea-${ index }-${ postTitle?.slice( 0, 24 ) }` }
									className="group grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30 m-0"
								>
									<span className="text-sm font-medium">
										<TrimWordsContent content={ postTitle || '' } count={ 120 } />
									</span>
									{ isCreated ? (
										<a
											href={ createdPosts[ postTitle ] }
											target="_blank"
											rel="noreferrer"
											className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-[oklch(0.55_0.16_155)] no-underline"
										>
											<Edit className="size-3.5" aria-hidden="true" />
											{ __( 'Edit', 'solvex-ai-blogger' ) }
										</a>
									) : (
										<button
											type="button"
											onClick={ () => createPost( postTitle ) }
											disabled={ isDisabled }
											className={ cn(
												'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
												isCreating
													? 'text-[oklch(0.55_0.16_155)]'
													: isDisabled
														? 'cursor-not-allowed text-muted-foreground/50'
														: 'text-muted-foreground group-hover:text-brand'
											) }
										>
											{ isCreating ? (
												<>
													<RotateCw className="size-3.5 animate-spin" aria-hidden="true" />
													{ __( 'Creating…', 'solvex-ai-blogger' ) }
												</>
											) : (
												<>
													<Plus className="size-3.5" aria-hidden="true" />
													{ __( 'Create', 'solvex-ai-blogger' ) }
												</>
											) }
										</button>
									) }
								</li>
							);
						} ) }
					</ul>
				) }

				{ ! proAvailable && postIdeasArr.length > 5 && (
					<div className="border-t border-border bg-brand-soft/40 px-6 py-4 text-center">
						<p className="text-xs font-semibold text-brand">
							{ `${ postIdeasArr.length - 5 } ${ __( 'more ideas available with Pro.', 'solvex-ai-blogger' ) }` }
						</p>
						<ProButton
							url={ proPurchaseUrl }
							variant="primary"
							size="small"
							icon={ <MoveRight className="h-4 w-4" /> }
							className="mt-3"
						>
							{ __( 'Unlock all ideas', 'solvex-ai-blogger' ) }
						</ProButton>
					</div>
				) }
			</div>
		</div>
	);
}

PostIdeas.displayName = 'PostIdeas';

export default PostIdeas;
