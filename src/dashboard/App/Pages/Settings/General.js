import React, { memo, useCallback, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { Slider } from '@Components/ui/slider';
import { Label } from '@Components/ui/label';
import { updateApiData } from '@Utils/ApiData';
import { useAutoSave } from '@Utils/useAutoSave';
import { cn } from '@Utils/cn';

const SAFETY_LABELS = [
	__( 'Off', 'solvex-ai-blogger' ),
	__( 'Block none', 'solvex-ai-blogger' ),
	__( 'Block few', 'solvex-ai-blogger' ),
	__( 'Block some', 'solvex-ai-blogger' ),
	__( 'Block most', 'solvex-ai-blogger' ),
];

const SAFETY_FILTERS = [
	{
		id: 'harassment',
		key: 'harassment',
		title: __( 'Harassment', 'solvex-ai-blogger' ),
		description: __( 'Blocks harassing or bullying content.', 'solvex-ai-blogger' ),
	},
	{
		id: 'hate',
		key: 'hate',
		title: __( 'Hate speech', 'solvex-ai-blogger' ),
		description: __( 'Blocks hateful or discriminatory content.', 'solvex-ai-blogger' ),
	},
	{
		id: 'sexually-explicit',
		key: 'sexuallyExplicit',
		title: __( 'Adult content', 'solvex-ai-blogger' ),
		description: __( 'Blocks sexually explicit content.', 'solvex-ai-blogger' ),
	},
	{
		id: 'dangerous-content',
		key: 'dangerousContent',
		title: __( 'Dangerous content', 'solvex-ai-blogger' ),
		description: __( 'Blocks potentially harmful instructions.', 'solvex-ai-blogger' ),
	},
];

function temperatureLabel( t ) {
	if ( t <= 0.3 ) {
		return __( 'Conservative', 'solvex-ai-blogger' );
	}
	if ( t <= 0.7 ) {
		return __( 'Balanced', 'solvex-ai-blogger' );
	}
	if ( t <= 1.2 ) {
		return __( 'Creative', 'solvex-ai-blogger' );
	}
	if ( t <= 1.6 ) {
		return __( 'Very creative', 'solvex-ai-blogger' );
	}
	return __( 'Experimental', 'solvex-ai-blogger' );
}

function Field( { label, htmlFor, hint, error, children } ) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor={ htmlFor }>{ label }</Label>
			{ children }
			{ error ? (
				<p className="text-xs text-destructive">{ error }</p>
			) : hint ? (
				<p className="text-xs text-muted-foreground">{ hint }</p>
			) : null }
		</div>
	);
}

const SettingsGeneral = memo( function SettingsGeneral() {
	const dispatch = useDispatch();
	const siteTitle = useSelector( ( s ) => s.siteTitle ) || '';
	const siteFor = useSelector( ( s ) => s.siteFor ) || '';
	const siteDescription = useSelector( ( s ) => s.siteDescription ) || '';
	const temperature = useSelector( ( s ) => s.temperature ?? 1 );
	const harassment = useSelector( ( s ) => s.harassment ?? 2 );
	const hate = useSelector( ( s ) => s.hate ?? 2 );
	const sexuallyExplicit = useSelector( ( s ) => s.sexuallyExplicit ?? 2 );
	const dangerousContent = useSelector( ( s ) => s.dangerousContent ?? 2 );

	const values = useMemo(
		() => ( {
			siteTitle,
			siteFor,
			siteDescription,
			temperature,
			harassment,
			hate,
			sexuallyExplicit,
			dangerousContent,
		} ),
		[ siteTitle, siteFor, siteDescription, temperature, harassment, hate, sexuallyExplicit, dangerousContent ]
	);

	const errors = useMemo( () => {
		const out = {};
		if ( ! siteTitle.trim() ) {
			out.siteTitle = __( 'Site title is required.', 'solvex-ai-blogger' );
		}
		if ( siteFor.trim().length > 0 && siteFor.trim().length < 10 ) {
			out.siteFor = __( 'At least 10 characters.', 'solvex-ai-blogger' );
		}
		if ( siteDescription.trim().length > 0 && siteDescription.trim().length < 20 ) {
			out.siteDescription = __( 'At least 20 characters.', 'solvex-ai-blogger' );
		}
		return out;
	}, [ siteTitle, siteFor, siteDescription ] );

	const save = useCallback(
		async ( next ) => {
			const map = {
				siteTitle: 'siteTitle',
				siteFor: 'siteFor',
				siteDescription: 'siteDescription',
				temperature: 'temperature',
				harassment: 'harassment',
				hate: 'hate',
				sexuallyExplicit: 'sexually_explicit',
				dangerousContent: 'dangerous_content',
			};
			await Promise.all(
				Object.entries( map ).map( ( [ key, apiKey ] ) => updateApiData( apiKey, next[ key ], dispatch ) )
			);
		},
		[ dispatch ]
	);

	useAutoSave( values, save );

	const onTitle = ( e ) => dispatch( { type: 'UPDATE_SITE_TITLE', payload: e.target.value } );
	const onFor = ( e ) => dispatch( { type: 'UPDATE_SITE_FOR', payload: e.target.value } );
	const onDesc = ( e ) => dispatch( { type: 'UPDATE_SITE_DESCRIPTION', payload: e.target.value } );
	const onTemp = ( [ value ] ) =>
		dispatch( { type: 'UPDATE_TEMPERATURE', payload: Math.max( 0, Math.min( 2, value ) ) } );

	const safetySetters = {
		harassment: 'UPDATE_HARASSMENT',
		hate: 'UPDATE_HATE',
		sexuallyExplicit: 'UPDATE_SEXUALLY_EXPLICIT',
		dangerousContent: 'UPDATE_DANGEROUS_CONTENT',
	};

	return (
		<div className="space-y-8">
			<section>
				<header className="mb-4">
					<h3 className="text-base font-semibold tracking-tight">
						{ __( 'Site persona', 'solvex-ai-blogger' ) }
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'Used by the AI when generating content.', 'solvex-ai-blogger' ) }
					</p>
				</header>
				<div className="space-y-5 rounded-xl border border-border bg-card p-6 ring-1 ring-black/[0.02]">
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<Field
							label={ __( 'Site title', 'solvex-ai-blogger' ) }
							htmlFor="settings-site-title"
							hint={ __( 'The main title of your website.', 'solvex-ai-blogger' ) }
							error={ errors.siteTitle }
						>
							<input
								id="settings-site-title"
								type="text"
								value={ siteTitle }
								onChange={ onTitle }
								maxLength={ 100 }
								className={ cn(
									'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15',
									errors.siteTitle && 'border-destructive focus-visible:ring-destructive/20'
								) }
								placeholder={ __( 'My AI Blog', 'solvex-ai-blogger' ) }
							/>
						</Field>
						<Field
							label={ __( 'Target audience', 'solvex-ai-blogger' ) }
							htmlFor="settings-site-for"
							hint={ __( 'Who is your blog written for?', 'solvex-ai-blogger' ) }
							error={ errors.siteFor }
						>
							<input
								id="settings-site-for"
								type="text"
								value={ siteFor }
								onChange={ onFor }
								maxLength={ 200 }
								className={ cn(
									'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15',
									errors.siteFor && 'border-destructive focus-visible:ring-destructive/20'
								) }
								placeholder={ __( 'Small business owners', 'solvex-ai-blogger' ) }
							/>
						</Field>
					</div>
					<Field
						label={ __( 'Detailed description', 'solvex-ai-blogger' ) }
						htmlFor="settings-site-description"
						hint={ __( 'Tone, niche, and content focus — helps the AI target your readers.', 'solvex-ai-blogger' ) }
						error={ errors.siteDescription }
					>
						<textarea
							id="settings-site-description"
							value={ siteDescription }
							onChange={ onDesc }
							rows={ 5 }
							maxLength={ 500 }
							className={ cn(
								'flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15',
								errors.siteDescription && 'border-destructive focus-visible:ring-destructive/20'
							) }
							placeholder={ __( 'Friendly, practical tutorials for…', 'solvex-ai-blogger' ) }
						/>
					</Field>
				</div>
			</section>

			<section>
				<header className="mb-1">
					<h3 className="text-base font-semibold tracking-tight">
						{ __( 'Advanced AI Settings', 'solvex-ai-blogger' ) }
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'Configure creativity temperature and content safety filters.', 'solvex-ai-blogger' ) }
					</p>
				</header>

				<div className="mt-5 rounded-xl border border-border bg-card p-6 ring-1 ring-black/[0.02]">
					<div className="flex items-center justify-between">
						<div>
							<Label className="text-sm font-semibold">
								{ __( 'Creativity Temperature', 'solvex-ai-blogger' ) }
							</Label>
							<p className="mt-0.5 text-xs text-muted-foreground">
								{ __( 'Controls randomness in content generation.', 'solvex-ai-blogger' ) }
							</p>
						</div>
						<span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
							{ temperatureLabel( temperature ) } · { temperature.toFixed( 2 ) }
						</span>
					</div>
					<Slider
						className="mt-4"
						value={ [ temperature ] }
						min={ 0 }
						max={ 2 }
						step={ 0.05 }
						onValueChange={ onTemp }
						aria-label={ __( 'Creativity temperature', 'solvex-ai-blogger' ) }
					/>
					<div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
						<span>{ __( 'More predictable', 'solvex-ai-blogger' ) }</span>
						<span>{ __( 'More creative', 'solvex-ai-blogger' ) }</span>
					</div>
				</div>

				<div className="mt-6">
					<h4 className="text-sm font-semibold tracking-tight">
						{ __( 'Content Safety Filters', 'solvex-ai-blogger' ) }
					</h4>
					<div className="mt-3 grid gap-4 sm:grid-cols-2">
						{ SAFETY_FILTERS.map( ( filter ) => {
							const current = values[ filter.key ];
							return (
								<div
									key={ filter.id }
									className="rounded-xl border border-border bg-card p-5 ring-1 ring-black/[0.02]"
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<Label className="text-sm font-semibold">{ filter.title }</Label>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{ filter.description }
											</p>
										</div>
										<span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
											{ SAFETY_LABELS[ current ] }
										</span>
									</div>
									<Slider
										className="mt-4"
										value={ [ current ] }
										min={ 0 }
										max={ 4 }
										step={ 1 }
										onValueChange={ ( [ v ] ) =>
											dispatch( {
												type: safetySetters[ filter.key ],
												payload: Math.max( 0, Math.min( 4, Math.round( v ) ) ),
											} )
										}
										aria-label={ filter.title }
									/>
									<div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
										{ [ 'Off', '1', '2', '3', '4' ].map( ( tick, idx ) => (
											<span
												key={ tick }
												className={ cn(
													'tabular-nums',
													current === idx && 'font-bold text-brand'
												) }
											>
												{ tick }
											</span>
										) ) }
									</div>
								</div>
							);
						} ) }
					</div>
				</div>

				<div className="mt-5 rounded-xl border border-[oklch(0.85_0.08_155)] bg-[oklch(0.97_0.04_155)] px-4 py-3 text-sm text-[oklch(0.35_0.12_155)]">
					<strong className="font-semibold">{ __( 'Safety Filter Guidelines.', 'solvex-ai-blogger' ) }</strong>
					{ ' ' }
					{ __( 'Higher levels provide stronger moderation but may be more restrictive. Adjust based on your audience.', 'solvex-ai-blogger' ) }
				</div>
			</section>
		</div>
	);
} );

SettingsGeneral.displayName = 'SettingsGeneral';

export default SettingsGeneral;
